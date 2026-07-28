# Deploy & secrets

## Why the live site does not “see” your GitHub secret

| Where you set `DATABASE_URL` | Who can read it |
| --- | --- |
| **GitHub → Environments → production → Environment secrets** | Only **GitHub Actions** jobs that use `environment: production` |
| **GitHub → Settings → Secrets → Actions (repository secrets)** | Actions (all workflows); some hosts may import these |
| **Grok Publish / Vercel project → Environment Variables** | The **running website** |

The publish/deploy **website does not load GitHub Environment secrets**.  
That is expected. Our [Deploy production](.github/workflows/deploy.yml) workflow **does** use them (Neon bootstrap already succeeded).

## What you already have working

- GitHub Environment **`production`** secret `DATABASE_URL` → used by Actions  
- Neon bootstrapped: tables + demo seed (4 cars, 7 parts)

## What the live app still needs

Set **`DATABASE_URL`** on the **host that runs the website**:

### Option A — Grok Publish

1. Open **Publish App** for this project  
2. Find **Environment variables** / secrets (or project settings)  
3. Add:

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | Same Neon URL you put on GitHub (pooled URL preferred) |

4. Publish / redeploy  
5. Open `/api/stats/health` — you want `"db":"neon"` and `"databaseUrlConfigured":true`

### Option B — Vercel

1. [vercel.com](https://vercel.com) → import `Criscode2022/scrapyard-manager`  
2. **Project → Settings → Environment Variables**  
3. Add `DATABASE_URL` for Production (and Preview if you want)  
4. Redeploy  

Or add to the GitHub **production** environment and re-run Actions:

| Secret | Value |
| --- | --- |
| `VERCEL_TOKEN` | Vercel token |
| `VERCEL_ORG_ID` | Team/user id |
| `VERCEL_PROJECT_ID` | Project id |
| `DATABASE_URL` | (already set) |

The workflow will deploy and Vercel will receive env from the project settings (set `DATABASE_URL` on Vercel as well, or use `vercel env`).

## Quick check

After the host has the variable:

```text
GET https://YOUR-APP/api/stats/health
```

```json
{
  "ok": true,
  "db": "neon",
  "databaseUrlConfigured": true,
  "service": "scrapyard-api"
}
```

If you see `"db":"memory"` and `"databaseUrlConfigured":false`, the **host** still does not have `DATABASE_URL` — fixing GitHub alone will not change that.
