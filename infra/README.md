# Deploy (free tier)

Split deploy: **static client → Vercel**, **FastAPI backend → Cloudflare Worker**.
Ollama is not deployed (no free tier fits a 7GB model); the app already degrades to
"cloud generation" when it is absent. `docker compose up` still runs the full local
stack, Ollama included — nothing here changes local dev.

```
Browser ──► Vercel (static Vite build) ──► Cloudflare Worker (FastAPI) ──► NVIDIA NIM
```

## Frontend — Vercel (Git-integrated, no script)

Vercel auto-deploys on push to `master`. Configure the project **once** in the Vercel
dashboard:

- **Root Directory:** `client`
- **Environment Variable:** `VITE_API_BASE = https://arch-sketch-api.<subdomain>.workers.dev/api`
  (the Worker URL from the backend deploy, **with** the `/api` suffix)

`VITE_API_BASE` is read at *build* time and inlined into the bundle, so a change to it
requires a redeploy. It is a public URL, not a secret. Unset locally, the client falls
back to `http://localhost:8000/api` (what `docker compose` serves), so `yarn dev` needs
no `.env`. See `client/.env.example`.

## Backend — Cloudflare Worker

```bash
# First time only — set the secret (prompts securely, nothing is echoed):
cd infra/cloudflare && uv run wrangler login && uv run wrangler secret put NVIDIA_API_KEY

# Deploy (from repo root):
FRONTEND_ORIGIN=https://<your-app>.vercel.app ./infra/deploy-cloudflare.sh
```

`deploy-cloudflare.sh` copies `backend/` source into `infra/cloudflare/` (gitignored —
`backend/` stays the source of truth), then runs `pywrangler deploy`. `FRONTEND_ORIGIN`
is added to `ALLOWED_ORIGINS` so the browser passes CORS; omit it and prod CORS allows
only localhost.

### Secrets

`NVIDIA_API_KEY` is a Worker secret — set out-of-band with `wrangler secret put`, never
in `wrangler.jsonc` or any script. The deploy script only ever *pipes* it (from
`$NVIDIA_API_KEY` if you export it) or defers to the interactive prompt; it is never
printed or written to disk.

## Free-tier guards baked in

| Concern | Guard | Where |
|---|---|---|
| NVIDIA quota abuse | 20 generations / 60s / IP (`GENERATE_LIMIT`) | `wrangler.jsonc`, `services/rate_limit.py` |
| Runaway fallback latency | chain capped at 2 models in prod (~120s vs ~300s) | `NVIDIA_MAX_MODELS=2` |
| Per-model stall | 60s timeout, fails over to next | `NVIDIA_TIMEOUT_S=60` |
| Worker CPU (10ms free cap) | work is I/O-bound `await`; CPU cap excludes network wait | n/a |

## Caveat: Python Workers are beta

FastAPI-on-Workers is documented but beta (Pyodide, 1s startup limit). The real
smoke test is `pywrangler deploy` itself + `uv run pywrangler dev` locally. If the
beta bites, the backend is ~200 lines of real logic and ports to a TypeScript Worker
cleanly — that also drops the beta dependency.
