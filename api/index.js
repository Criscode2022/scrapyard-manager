/**
 * Vercel serverless API — Scrapyard Manager (Neon Postgres)
 * Mirrors Nest routes used by the Angular SPA.
 */
const { Client } = require('pg');
const { randomUUID } = require('crypto');

const FALLBACK_DATABASE_URL =
  'postgresql://neondb_owner:npg_CYMc2UmsLp6H@ep-shy-grass-zadb6nhp-pooler.c-2.eu-west-2.aws.neon.tech/neondb?sslmode=require';

function databaseUrl() {
  const env = process.env.DATABASE_URL && process.env.DATABASE_URL.trim();
  return env || FALLBACK_DATABASE_URL;
}

function source() {
  return process.env.DATABASE_URL && process.env.DATABASE_URL.trim()
    ? 'vercel-env'
    : 'deploy-fallback';
}

async function withDb(fn) {
  const c = new Client({
    connectionString: databaseUrl(),
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 12000,
  });
  await c.connect();
  try {
    return await fn(c);
  } finally {
    await c.end().catch(() => {});
  }
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(body));
}

function mapCar(row, parts) {
  if (!row) return null;
  return {
    id: row.id,
    make: row.make,
    model: row.model,
    year: Number(row.year),
    vin: row.vin,
    color: row.color,
    status: row.status,
    yardLocation: row.yardLocation,
    arrivalDate: row.arrivalDate,
    purchasePrice: Number(row.purchasePrice ?? 0),
    notes: row.notes,
    odometer: Number(row.odometer ?? 0),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    parts: parts || undefined,
  };
}

function mapPart(row, car) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    sku: row.sku,
    condition: row.condition,
    status: row.status,
    price: Number(row.price ?? 0),
    quantity: Number(row.quantity ?? 0),
    binLocation: row.binLocation,
    notes: row.notes,
    carId: row.carId,
    car: car || undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') {
      resolve(req.body);
      return;
    }
    let raw = '';
    req.on('data', (c) => {
      raw += c;
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function pathOf(req) {
  const u = new URL(req.url, 'http://localhost');
  return { pathname: u.pathname.replace(/\/$/, '') || '/', searchParams: u.searchParams };
}

const fs = require('fs');
const path = require('path');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

const { execSync } = require('child_process');
const PUBLIC_ROOT = '/tmp/scrapyard-public';
let publicReady = false;

function ensurePublic() {
  if (publicReady && fs.existsSync(path.join(PUBLIC_ROOT, 'index.html'))) return true;
  try {
    fs.mkdirSync(PUBLIC_ROOT, { recursive: true });
    if (!fs.existsSync(path.join(PUBLIC_ROOT, 'index.html'))) {
      execSync(
        'curl -fsSL https://github.com/Criscode2022/scrapyard-manager/archive/refs/heads/vercel-production.tar.gz | tar xz -C /tmp && rm -rf ' +
          PUBLIC_ROOT +
          ' && mv /tmp/scrapyard-manager-vercel-production/public ' +
          PUBLIC_ROOT,
        { stdio: 'pipe', timeout: 60000 },
      );
    }
    publicReady = fs.existsSync(path.join(PUBLIC_ROOT, 'index.html'));
  } catch (e) {
    console.error('ensurePublic failed', e);
    publicReady = false;
  }
  return publicReady;
}

function serveStatic(pathname, res) {
  if (!ensurePublic()) return false;
  const dir = PUBLIC_ROOT;
  let rel = pathname === '/' ? '/index.html' : pathname;
  const hasExt = path.extname(rel) !== '';
  let file = path.normalize(path.join(dir, rel));
  if (!file.startsWith(path.normalize(dir))) return false;
  if (!hasExt) {
    const spa = path.join(dir, 'index.html');
    if (fs.existsSync(spa)) file = spa;
    else return false;
  }
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    const ext = path.extname(file).toLowerCase();
    res.statusCode = 200;
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable');
    res.end(fs.readFileSync(file));
    return true;
  }
  return false;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.end();
    return;
  }

  try {
    const { pathname, searchParams } = pathOf(req);
    const method = req.method || 'GET';

    // Serve Angular SPA / assets for non-API GETs
    if (method === 'GET' && !pathname.startsWith('/api')) {
      if (serveStatic(pathname, res)) return;
      if (serveStatic('/', res)) return;
    }


    // Health
    if (
      (pathname === '/api/health' || pathname === '/api/stats/health') &&
      method === 'GET'
    ) {
      const data = await withDb(async (c) => {
        const ping = await c.query('select now() as now, current_database() as db');
        const cars = (await c.query('select count(*)::int as n from cars')).rows[0].n;
        const parts = (await c.query('select count(*)::int as n from parts')).rows[0].n;
        return { ping: ping.rows[0], cars, parts };
      });
      return send(res, 200, {
        ok: true,
        service: 'scrapyard-api',
        db: 'neon',
        databaseUrlConfigured: true,
        source: source(),
        neon: data.ping,
        cars: data.cars,
        parts: data.parts,
        endpoints: ['/api/cars', '/api/parts', '/api/stats', '/api/health'],
      });
    }

    // Stats (Angular dashboard)
    if (pathname === '/api/stats' && method === 'GET') {
      const stats = await withDb(async (c) => {
        const totalCars = (await c.query('select count(*)::int as n from cars')).rows[0].n;
        const totalParts = (await c.query('select count(*)::int as n from parts')).rows[0].n;
        const availableParts = (
          await c.query(`select count(*)::int as n from parts where status='available'`)
        ).rows[0].n;
        const reservedParts = (
          await c.query(`select count(*)::int as n from parts where status='reserved'`)
        ).rows[0].n;
        const soldParts = (
          await c.query(`select count(*)::int as n from parts where status='sold'`)
        ).rows[0].n;
        const inv = await c.query(
          `select coalesce(sum(price * quantity),0)::float as v from parts where status in ('available','reserved')`,
        );
        const statuses = ['arrived', 'dismantling', 'complete', 'crushed', 'sold'];
        const carsByStatus = [];
        for (const s of statuses) {
          const n = (
            await c.query('select count(*)::int as n from cars where status=$1', [s])
          ).rows[0].n;
          carsByStatus.push({ status: s, count: n });
        }
        const cats = [
          'engine',
          'transmission',
          'body',
          'interior',
          'electrical',
          'suspension',
          'brakes',
          'wheels',
          'glass',
          'other',
        ];
        const partsByCategory = [];
        for (const cat of cats) {
          const n = (
            await c.query('select count(*)::int as n from parts where category=$1', [cat])
          ).rows[0].n;
          partsByCategory.push({ category: cat, count: n });
        }
        const recentCars = (
          await c.query('select * from cars order by "createdAt" desc limit 6')
        ).rows.map((r) => mapCar(r));
        const recentParts = (
          await c.query('select * from parts order by "createdAt" desc limit 6')
        ).rows.map((r) => mapPart(r));
        return {
          totalCars,
          totalParts,
          availableParts,
          reservedParts,
          soldParts,
          inventoryValue: Number(inv.rows[0].v || 0),
          carsByStatus,
          partsByCategory,
          recentCars,
          recentParts,
          dbSource: 'neon',
        };
      });
      return send(res, 200, stats);
    }

    // Cars collection
    if (pathname === '/api/cars' && method === 'GET') {
      const status = searchParams.get('status');
      const q = searchParams.get('q');
      const cars = await withDb(async (c) => {
        let sql = 'select * from cars where 1=1';
        const params = [];
        if (status) {
          params.push(status);
          sql += ` and status=$${params.length}`;
        }
        if (q) {
          params.push(`%${q}%`);
          sql += ` and (make ilike $${params.length} or model ilike $${params.length} or coalesce(vin,'') ilike $${params.length})`;
        }
        sql += ' order by "createdAt" desc';
        const rows = (await c.query(sql, params)).rows;
        const out = [];
        for (const row of rows) {
          const parts = (
            await c.query('select * from parts where "carId"=$1 order by name', [row.id])
          ).rows.map((p) => mapPart(p));
          out.push(mapCar(row, parts));
        }
        return out;
      });
      return send(res, 200, cars);
    }

    if (pathname === '/api/cars' && method === 'POST') {
      const body = await parseBody(req);
      const car = await withDb(async (c) => {
        const id = randomUUID();
        const now = new Date().toISOString();
        const r = await c.query(
          `insert into cars (id, make, model, year, vin, color, status, "yardLocation", "arrivalDate", "purchasePrice", notes, odometer, "createdAt", "updatedAt")
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13) returning *`,
          [
            id,
            body.make,
            body.model,
            Number(body.year),
            body.vin || null,
            body.color || null,
            body.status || 'arrived',
            body.yardLocation || null,
            body.arrivalDate || null,
            Number(body.purchasePrice || 0),
            body.notes || null,
            Number(body.odometer || 0),
            now,
          ],
        );
        return mapCar(r.rows[0], []);
      });
      return send(res, 201, car);
    }

    // Car by id
    const carMatch = pathname.match(/^\/api\/cars\/([^/]+)$/);
    if (carMatch) {
      const id = carMatch[1];
      if (method === 'GET') {
        const car = await withDb(async (c) => {
          const r = await c.query('select * from cars where id=$1', [id]);
          if (!r.rows[0]) return null;
          const parts = (
            await c.query('select * from parts where "carId"=$1 order by name', [id])
          ).rows.map((p) => mapPart(p));
          return mapCar(r.rows[0], parts);
        });
        if (!car) return send(res, 404, { message: 'Car not found' });
        return send(res, 200, car);
      }
      if (method === 'PATCH') {
        const body = await parseBody(req);
        const car = await withDb(async (c) => {
          const cur = await c.query('select * from cars where id=$1', [id]);
          if (!cur.rows[0]) return null;
          const o = cur.rows[0];
          const now = new Date().toISOString();
          const r = await c.query(
            `update cars set make=$2, model=$3, year=$4, vin=$5, color=$6, status=$7,
              "yardLocation"=$8, "arrivalDate"=$9, "purchasePrice"=$10, notes=$11, odometer=$12, "updatedAt"=$13
             where id=$1 returning *`,
            [
              id,
              body.make ?? o.make,
              body.model ?? o.model,
              body.year != null ? Number(body.year) : o.year,
              body.vin !== undefined ? body.vin : o.vin,
              body.color !== undefined ? body.color : o.color,
              body.status ?? o.status,
              body.yardLocation !== undefined ? body.yardLocation : o.yardLocation,
              body.arrivalDate !== undefined ? body.arrivalDate : o.arrivalDate,
              body.purchasePrice != null ? Number(body.purchasePrice) : o.purchasePrice,
              body.notes !== undefined ? body.notes : o.notes,
              body.odometer != null ? Number(body.odometer) : o.odometer,
              now,
            ],
          );
          const parts = (
            await c.query('select * from parts where "carId"=$1', [id])
          ).rows.map((p) => mapPart(p));
          return mapCar(r.rows[0], parts);
        });
        if (!car) return send(res, 404, { message: 'Car not found' });
        return send(res, 200, car);
      }
      if (method === 'DELETE') {
        const ok = await withDb(async (c) => {
          await c.query('update parts set "carId"=null where "carId"=$1', [id]);
          const r = await c.query('delete from cars where id=$1', [id]);
          return r.rowCount > 0;
        });
        if (!ok) return send(res, 404, { message: 'Car not found' });
        return send(res, 200, { deleted: true });
      }
    }

    // Parts collection
    if (pathname === '/api/parts' && method === 'GET') {
      const status = searchParams.get('status');
      const category = searchParams.get('category');
      const carId = searchParams.get('carId');
      const q = searchParams.get('q');
      const parts = await withDb(async (c) => {
        let sql = 'select * from parts where 1=1';
        const params = [];
        if (status) {
          params.push(status);
          sql += ` and status=$${params.length}`;
        }
        if (category) {
          params.push(category);
          sql += ` and category=$${params.length}`;
        }
        if (carId) {
          params.push(carId);
          sql += ` and "carId"=$${params.length}`;
        }
        if (q) {
          params.push(`%${q}%`);
          sql += ` and (name ilike $${params.length} or coalesce(sku,'') ilike $${params.length})`;
        }
        sql += ' order by "createdAt" desc';
        const rows = (await c.query(sql, params)).rows;
        return rows.map((r) => mapPart(r));
      });
      return send(res, 200, parts);
    }

    if (pathname === '/api/parts' && method === 'POST') {
      const body = await parseBody(req);
      const part = await withDb(async (c) => {
        const id = randomUUID();
        const now = new Date().toISOString();
        const r = await c.query(
          `insert into parts (id, name, category, sku, condition, status, price, quantity, "binLocation", notes, "carId", "createdAt", "updatedAt")
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12) returning *`,
          [
            id,
            body.name,
            body.category || 'other',
            body.sku || null,
            body.condition || 'used_good',
            body.status || 'available',
            Number(body.price || 0),
            Number(body.quantity || 1),
            body.binLocation || null,
            body.notes || null,
            body.carId || null,
            now,
          ],
        );
        return mapPart(r.rows[0]);
      });
      return send(res, 201, part);
    }

    const partMatch = pathname.match(/^\/api\/parts\/([^/]+)$/);
    if (partMatch) {
      const id = partMatch[1];
      if (method === 'GET') {
        const part = await withDb(async (c) => {
          const r = await c.query('select * from parts where id=$1', [id]);
          if (!r.rows[0]) return null;
          let car = null;
          if (r.rows[0].carId) {
            const cr = await c.query('select * from cars where id=$1', [r.rows[0].carId]);
            car = mapCar(cr.rows[0]);
          }
          return mapPart(r.rows[0], car);
        });
        if (!part) return send(res, 404, { message: 'Part not found' });
        return send(res, 200, part);
      }
      if (method === 'PATCH') {
        const body = await parseBody(req);
        const part = await withDb(async (c) => {
          const cur = await c.query('select * from parts where id=$1', [id]);
          if (!cur.rows[0]) return null;
          const o = cur.rows[0];
          const now = new Date().toISOString();
          const r = await c.query(
            `update parts set name=$2, category=$3, sku=$4, condition=$5, status=$6, price=$7,
              quantity=$8, "binLocation"=$9, notes=$10, "carId"=$11, "updatedAt"=$12
             where id=$1 returning *`,
            [
              id,
              body.name ?? o.name,
              body.category ?? o.category,
              body.sku !== undefined ? body.sku : o.sku,
              body.condition ?? o.condition,
              body.status ?? o.status,
              body.price != null ? Number(body.price) : o.price,
              body.quantity != null ? Number(body.quantity) : o.quantity,
              body.binLocation !== undefined ? body.binLocation : o.binLocation,
              body.notes !== undefined ? body.notes : o.notes,
              body.carId !== undefined ? body.carId : o.carId,
              now,
            ],
          );
          return mapPart(r.rows[0]);
        });
        if (!part) return send(res, 404, { message: 'Part not found' });
        return send(res, 200, part);
      }
      if (method === 'DELETE') {
        const ok = await withDb(async (c) => {
          const r = await c.query('delete from parts where id=$1', [id]);
          return r.rowCount > 0;
        });
        if (!ok) return send(res, 404, { message: 'Part not found' });
        return send(res, 200, { deleted: true });
      }
    }

    return send(res, 404, { ok: false, message: `No route ${method} ${pathname}` });
  } catch (e) {
    console.error(e);
    return send(res, 500, {
      ok: false,
      db: 'error',
      error: String(e && e.message ? e.message : e),
      source: source(),
    });
  }
};
