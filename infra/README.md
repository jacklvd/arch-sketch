# Deploy (free tier)

Split deploy: **static client → Vercel**, **backend → Cloudflare Worker** (a lean,
framework-free Python Worker — see the note below on why not FastAPI). Ollama is not
deployed (no free tier fits a 7GB model); the app already degrades to "cloud
generation" when it is absent. `docker compose up` still runs the full local stack,
FastAPI + Ollama included — nothing here changes local dev.

```
Browser ──► Vercel (static Vite build) ──► Cloudflare Worker (lean) ──► NVIDIA NIM
```

Live: client at the Vercel domain, backend at `https://arch-sketch-api.<subdomain>.workers.dev`.

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
# First time only — log in and set the secret (prompts securely, nothing is echoed).
# Note: `wrangler` is not standalone here — route through pywrangler, which proxies it.
cd infra/cloudflare && uv run pywrangler whoami && uv run pywrangler secret put NVIDIA_API_KEY

# Deploy (from repo root):
FRONTEND_ORIGIN=https://<your-app>.vercel.app ./infra/deploy-cloudflare.sh
```

`deploy-cloudflare.sh` copies `backend/services` + `backend/prompts` into
`infra/cloudflare/` (gitignored — `backend/` stays the source of truth), then:
`pywrangler sync` (vendors httpx + the Workers SDK into `python_modules/`) →
**strips the build `.venv` dirs** (wrangler uploads everything in the dir, and the
venvs are three full copies of the deps that blow the 3 MiB limit) → `wrangler deploy`.
`FRONTEND_ORIGIN` is added to `ALLOWED_ORIGINS` so the browser passes CORS; omit it and
the deploy fails fast (pass `ALLOW_LOCALHOST_ONLY=1` to override).

### Secrets

`NVIDIA_API_KEY` is a Worker secret — set out-of-band with `wrangler secret put`, never
in `wrangler.jsonc` or any script. The deploy script only ever *pipes* it (from
`$NVIDIA_API_KEY` if you export it) or defers to the interactive prompt; it is never
printed or written to disk.

## Free-tier guards baked in

| Concern | Guard | Where |
|---|---|---|
| NVIDIA quota abuse | 10 generations / 60s / IP (`GENERATE_LIMIT`) | `wrangler.jsonc`, `services/rate_limit.py` |
| Runaway fallback latency | chain capped at 2 models in prod (~120s vs ~300s) | `NVIDIA_MAX_MODELS=2` |
| Per-model stall | 60s timeout, fails over to next | `NVIDIA_TIMEOUT_S=60` |
| Worker CPU (10ms free cap) | work is I/O-bound `await`; CPU cap excludes network wait | n/a |

The rate limiter is Cloudflare's built-in binding — per-colo and **approximate**, so
treat 10/60 as a soft ceiling, not an exact cap. It keys on `CF-Connecting-IP`
(`X-Forwarded-For` is untrusted). Verified enforcing (a 3/10 test returns 429s); a real
user never approaches it.

## Why the Worker is lean (not FastAPI)

The obvious approach — run the container's FastAPI app at the edge via `asgi.fetch` —
**does not fit the free tier**. Two walls, hit in order:

1. **Size (3 MiB gzip).** fastapi + pydantic + starlette vendor to ~7 MiB. Even after
   fixing the `.venv`-upload bug it's ~2.9 MiB — right at the edge and fragile.
2. **Runtime (the hard one).** Loading pydantic-core (a ~2 MiB wasm module) + starlette
   in Pyodide exceeds the free isolate's CPU/memory/startup budget — the Worker deploys
   but every request fails to initialise (errors 1101/1102). No config fixes this on the
   free plan.

So the edge uses a hand-rolled handler (`infra/cloudflare/worker.py`, ~120 lines) with
just the Workers SDK + httpx, reusing the container's pure-Python logic unchanged
(`build_prompt`, `nvidia_client.generate`, `json_repair`, `rate_limit`). Result: **309
KiB gzip, ~520 ms startup, stable on free.** The container keeps FastAPI (`backend/main.py`);
only the edge entrypoint differs. Python Workers are still beta — the real smoke test is
`uv run pywrangler dev` locally, which the deploy exercises.
