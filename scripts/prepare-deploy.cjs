#!/usr/bin/env node
/**
 * Stage deploy artifacts for Vercel / Grok publish:
 *  1. public/  — Angular SPA (static)
 *  2. .vercel/output — Vercel Build Output API (explicit entrypoints)
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const webDist = path.join(root, 'apps/web/dist/web/browser');
const publicDir = path.join(root, 'public');
const apiDistMain = path.join(root, 'apps/api/dist/main.js');
const apiDistDir = path.join(root, 'apps/api/dist');
const apiNodeModules = path.join(root, 'apps/api/node_modules');
const vercelOut = path.join(root, '.vercel', 'output');

function cpRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      // skip heavy / unnecessary folders
      if (
        entry.name === '.cache' ||
        entry.name === 'test' ||
        entry.name === 'docs' ||
        entry.name === 'examples'
      ) {
        continue;
      }
      cpRecursive(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

if (!fs.existsSync(webDist)) {
  console.error('Missing Angular build at', webDist);
  process.exit(1);
}
if (!fs.existsSync(apiDistMain)) {
  console.error('Missing Nest build at', apiDistMain);
  process.exit(1);
}

// 1) public/ for outputDirectory fallback
fs.rmSync(publicDir, { recursive: true, force: true });
cpRecursive(webDist, publicDir);
console.log('Staged Angular → public/');

// 2) Vercel Build Output API
fs.rmSync(vercelOut, { recursive: true, force: true });

// Static SPA
const staticDir = path.join(vercelOut, 'static');
cpRecursive(webDist, staticDir);
console.log('Staged Angular → .vercel/output/static/');

// Serverless function for Nest API
const funcDir = path.join(vercelOut, 'functions', 'api.func');
fs.mkdirSync(funcDir, { recursive: true });

// Handler that boots Nest once and reuses Express
const handlerSource = `const Module = require('module');
const path = require('path');
const root = __dirname;
const nm = path.join(root, 'node_modules');
process.env.NODE_PATH = [nm, process.env.NODE_PATH].filter(Boolean).join(path.delimiter);
Module._initPaths();

let cached;

async function getApp() {
  if (cached) return cached;
  const express = require('express');
  const { NestFactory } = require('@nestjs/core');
  const { ExpressAdapter } = require('@nestjs/platform-express');
  const { ValidationPipe } = require('@nestjs/common');
  const { AppModule } = require('./dist/app.module');

  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    logger: ['error', 'warn', 'log'],
  });
  app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));
  await app.init();
  cached = expressApp;
  return cached;
}

module.exports = async (req, res) => {
  const app = await getApp();
  return app(req, res);
};
`;

write(path.join(funcDir, 'index.js'), handlerSource);
write(
  path.join(funcDir, '.vc-config.json'),
  JSON.stringify(
    {
      runtime: 'nodejs22.x',
      handler: 'index.js',
      launcherType: 'Nodejs',
      shouldAddHelpers: true,
      supportsResponseStreaming: false,
      maxDuration: 30,
      memory: 1024,
    },
    null,
    2,
  ),
);

// Copy Nest dist + production node_modules into the function bundle
cpRecursive(apiDistDir, path.join(funcDir, 'dist'));
console.log('Copying API node_modules into function (this may take a moment)…');
cpRecursive(apiNodeModules, path.join(funcDir, 'node_modules'));

// Routing config
write(
  path.join(vercelOut, 'config.json'),
  JSON.stringify(
    {
      version: 3,
      routes: [
        {
          src: '/api(?:/.*)?$',
          dest: '/api',
        },
        {
          handle: 'filesystem',
        },
        {
          src: '/(.*)',
          dest: '/index.html',
        },
      ],
    },
    null,
    2,
  ),
);

// Root entrypoints for scanners that ignore Build Output API
const entries = ['server.js', 'index.js', 'app.js', 'api/index.js'];
for (const rel of entries) {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error('Missing entrypoint', rel);
    process.exit(1);
  }
}

write(
  path.join(root, '.deploy-ready'),
  JSON.stringify(
    {
      ready: true,
      at: new Date().toISOString(),
      spa: 'public/index.html',
      vercelOutput: '.vercel/output',
      main: 'server.js',
    },
    null,
    2,
  ),
);

console.log('Nest entry:', apiDistMain);
console.log('Vercel output:', vercelOut);
console.log('Deploy prepare complete.');
