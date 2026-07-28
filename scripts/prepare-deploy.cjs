#!/usr/bin/env node
/**
 * After Angular + Nest builds, stage artifacts for Vercel / Grok publish:
 *  - public/  → Angular browser bundle (static)
 *  - confirms Nest dist + root entrypoints exist
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const webDist = path.join(root, 'apps/web/dist/web/browser');
const publicDir = path.join(root, 'public');
const apiDistMain = path.join(root, 'apps/api/dist/main.js');

function cpRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) cpRecursive(from, to);
    else fs.copyFileSync(from, to);
  }
}

if (!fs.existsSync(webDist)) {
  console.error('Missing Angular build at', webDist);
  process.exit(1);
}
if (!fs.existsSync(apiDistMain)) {
  console.error('Missing Nest build at', apiDistMain);
  process.exit(1);
}

// Stage SPA for Vercel static output
fs.rmSync(publicDir, { recursive: true, force: true });
cpRecursive(webDist, publicDir);

// Ensure root entrypoints exist (publish scanners look for these)
const entries = ['server.js', 'index.js', 'app.js', 'api/index.js'];
for (const rel of entries) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    console.error('Missing entrypoint', rel);
    process.exit(1);
  }
}

// Write a tiny marker so deploy tooling sees a completed build
fs.writeFileSync(
  path.join(root, '.deploy-ready'),
  JSON.stringify(
    {
      ready: true,
      at: new Date().toISOString(),
      spa: 'public/index.html',
      api: 'apps/api/dist/main.js',
      main: 'server.js',
    },
    null,
    2,
  ),
);

console.log('Staged Angular → public/');
console.log('Nest entry:', apiDistMain);
console.log('Root entrypoints: server.js, index.js, app.js, api/index.js');
console.log('Deploy prepare complete.');
