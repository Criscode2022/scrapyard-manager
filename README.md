# Ironlot — Scrapyard Manager

Full-stack app to manage **cars** and **parts** at a scrapyard.

| Layer | Stack |
| --- | --- |
| Frontend | **Angular 19** (standalone components, signals, card + table views) |
| Backend | **NestJS 11** REST API |
| Database | **Neon Postgres** (TypeORM) with in-memory fallback for local preview |

**Repository:** https://github.com/Criscode2022/scrapyard-manager

## Features

- Modern visual dashboard — KPI tiles, car pipeline, category bars, quick actions
- Cars & parts as **cards or table** with search/filter
- Car detail with status updates and pulled parts
- Seeded demo data for a quick tour
- Neon-ready: set `DATABASE_URL` and tables + seed run automatically

## Project layout

```text
apps/
  api/   NestJS API (TypeORM + Neon / memory)
  web/   Angular SPA
scripts/
  setup-neon.mjs   Create a Neon project via API key
.github/
  workflows/       CI + Neon secret check
```

## Quick start

```bash
git clone https://github.com/Criscode2022/scrapyard-manager.git
cd scrapyard-manager
cd apps/api && npm install
cd ../web && npm install
cd ../..
npm run build
PORT=8080 npm run start:api
```

Without `DATABASE_URL`, the API uses a seeded **in-memory** store.

### Neon database

1. Create an API key at [console.neon.tech](https://console.neon.tech) → Account settings → API keys  
2. Create a project:

```bash
export NEON_API_KEY=nap_...
node scripts/setup-neon.mjs --name scrapyard-manager
# prints DATABASE_URL
```

3. Use it locally:

```bash
export DATABASE_URL='postgresql://…@ep-….neon.tech/neondb?sslmode=require'
# restart the API
```

4. GitHub **environment secrets** (environments `production` and `preview` are created on the repo):

```bash
# Requires a GitHub token with Actions secrets: write
echo -n "$DATABASE_URL" | gh secret set DATABASE_URL --env production -R Criscode2022/scrapyard-manager
echo -n "$DATABASE_URL" | gh secret set DATABASE_URL --env preview -R Criscode2022/scrapyard-manager
```

> **Note:** The Grok/GitHub integration token used during app generation can create environments but **cannot write secrets** (HTTP 403). Set `DATABASE_URL` yourself in  
> **Repo → Settings → Environments → production → Environment secrets**,  
> or with `gh secret set` using a PAT that has `secrets` write.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/stats` | Dashboard metrics |
| GET | `/api/stats/health` | Health + db mode (`neon` \| `memory`) |
| GET/POST | `/api/cars` | List / create cars |
| GET/PATCH/DELETE | `/api/cars/:id` | Car detail / update / delete |
| GET/POST | `/api/parts` | List / create parts |
| GET/PATCH/DELETE | `/api/parts/:id` | Part detail / update / delete |

Query params: `status`, `category`, `carId`, `q` (search).

## License

MIT
