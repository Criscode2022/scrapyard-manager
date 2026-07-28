/**
 * Vercel serverless function — handles /api/*
 * Caches the Nest/Express app across warm invocations.
 */
const Module = require('module');
const path = require('path');

const root = path.join(__dirname, '..');
const apiNodeModules = path.join(root, 'apps', 'api', 'node_modules');
process.env.NODE_PATH = [apiNodeModules, process.env.NODE_PATH]
  .filter(Boolean)
  .join(path.delimiter);
Module._initPaths();

let cachedApp;

async function createApp() {
  if (cachedApp) return cachedApp;

  // eslint-disable-next-line import/no-dynamic-require, global-require
  const express = require(path.join(apiNodeModules, 'express'));
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const { NestFactory } = require(path.join(apiNodeModules, '@nestjs/core'));
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const { ExpressAdapter } = require(path.join(
    apiNodeModules,
    '@nestjs/platform-express',
  ));
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const { ValidationPipe } = require(path.join(apiNodeModules, '@nestjs/common'));
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const { AppModule } = require(path.join(root, 'apps/api/dist/app.module'));

  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create(AppModule, adapter, {
    logger: ['error', 'warn', 'log'],
  });

  app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();
  cachedApp = expressApp;
  return cachedApp;
}

module.exports = async function handler(req, res) {
  const app = await createApp();
  return app(req, res);
};
