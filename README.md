# Ironlot — Scrapyard Manager

Full-stack app to manage **cars** and **parts** at a scrapyard.

| Layer | Stack |
| --- | --- |
| Frontend | **Angular 19** (standalone components, signals) |
| Backend | **NestJS 11** REST API |
| Database | **Neon Postgres** (TypeORM) with in-memory fallback for local preview |

**Repository:** https://github.com/Criscode2022/scrapyard-manager

## Features

- Dashboard with inventory value, status breakdowns, recent activity
- Cars CRUD — make/model/year, VIN, yard row, status pipeline (arrived → dismantling → complete → crushed/sold)
- Parts CRUD — category, condition, price, qty, bin location, source car link
- Car detail view with parts pulled from that vehicle
- Search & filter on cars and parts
- Seeded demo data for a quick tour

## Project layout

```text
apps/
  api/   NestJS API (TypeORM + Neon / memory)
  web/   Angular SPA
```

## Quick start

```bash
# Install
cd apps/api && npm install
cd ../web && npm install

# Optional: Neon connection string
export DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"

# Build Angular + start API (serves SPA + /api on :8080)
cd ../..
npm run build
PORT=8080 npm run start:api
```

Open http://localhost:8080

Without `DATABASE_URL`, the API uses a seeded **in-memory** store so the UI works offline/preview.

### Dev (API watch + Angular with proxy)

```bash
# terminal 1
cd apps/api && PORT=8080 npm run start:dev

# terminal 2
cd apps/web && npx ng serve --host 0.0.0.0 --port 4200
```

Angular proxies `/api` → `http://127.0.0.1:8080` via `apps/web/proxy.conf.json`.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/stats` | Dashboard metrics |
| GET | `/api/stats/health` | Health + db mode |
| GET/POST | `/api/cars` | List / create cars |
| GET/PATCH/DELETE | `/api/cars/:id` | Car detail / update / delete |
| GET/POST | `/api/parts` | List / create parts |
| GET/PATCH/DELETE | `/api/parts/:id` | Part detail / update / delete |

Query params: `status`, `category`, `carId`, `q` (search).

## Neon setup

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string
3. Set `DATABASE_URL` in your host / Vercel / Railway env
4. Restart the API — TypeORM `synchronize` creates tables and seeds demo rows if empty

> For production, prefer migrations over `synchronize: true` (toggle in `apps/api/src/database/database.module.ts`).

## License

MIT
