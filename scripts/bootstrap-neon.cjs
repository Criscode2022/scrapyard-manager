#!/usr/bin/env node
/**
 * Connects to Neon via DATABASE_URL, lets Nest/TypeORM synchronize schema
 * and SeedService populate demo data when empty, then exits.
 *
 * Used by GitHub Actions production deploy (environment secrets).
 */
const path = require('path');
const Module = require('module');

const root = path.resolve(__dirname, '..');
const apiNm = path.join(root, 'apps/api/node_modules');
process.env.NODE_PATH = [apiNm, process.env.NODE_PATH].filter(Boolean).join(path.delimiter);
Module._initPaths();

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error('DATABASE_URL is missing — cannot bootstrap Neon.');
    process.exit(1);
  }

  let host = 'unknown';
  try {
    host = new URL(url).hostname;
  } catch {
    /* ignore */
  }
  console.log(`Connecting to Neon host: ${host}`);

  // Lightweight connectivity check first
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const { Client } = require(path.join(apiNm, 'pg'));
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
  await client.connect();
  const ping = await client.query('select now() as now, current_database() as db');
  console.log('Neon OK:', ping.rows[0]);
  await client.end();

  // Full Nest context → TypeORM synchronize + SeedService
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const { NestFactory } = require(path.join(apiNm, '@nestjs/core'));
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const { AppModule } = require(path.join(root, 'apps/api/dist/app.module'));

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  // SeedService + schema already ran in onModuleInit
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const { DatabaseService } = require(path.join(
    root,
    'apps/api/dist/database/database.service',
  ));
  const db = app.get(DatabaseService);
  const cars = await db.listCars();
  const parts = await db.listParts({});
  console.log(`Database mode: ${db.mode}`);
  console.log(`Cars: ${cars.length}, Parts: ${parts.length}`);
  await app.close();

  if (db.mode !== 'neon') {
    console.error('Expected neon mode after bootstrap.');
    process.exit(1);
  }
  console.log('Neon bootstrap complete.');
}

main().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
