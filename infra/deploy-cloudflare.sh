#!/usr/bin/env bash
#
# Deploy the FastAPI backend to Cloudflare Workers (Python/Pyodide).
#
# Source of truth is backend/. This copies that source next to the Worker
# entrypoint (gitignored), then runs pywrangler. backend/ is never modified.
#
# CREDENTIAL SAFETY:
#   - NVIDIA_API_KEY is a Worker *secret*. It is never printed, never written to a
#     file, and never passed as a command-line argument (argv is visible in `ps`).
#     It is piped to `wrangler secret put` over stdin, or you set it interactively.
#   - Nothing here echoes secret values. `set -x` is intentionally NOT used.
#
# Usage:
#   ./infra/deploy-cloudflare.sh
#
# Optional environment:
#   FRONTEND_ORIGIN   e.g. https://arch-sketch.vercel.app — added to ALLOWED_ORIGINS
#                     so the browser passes CORS. Without it, prod CORS will block.
#   NVIDIA_API_KEY    if set, seeds the Worker secret non-interactively (piped, not
#                     echoed). If unset and no secret exists yet, you'll be prompted.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKER_DIR="$HERE/cloudflare"
BACKEND_DIR="$HERE/../backend"

cd "$WORKER_DIR"

echo "==> Staging backend source into the Worker bundle"
# Only services/ + prompts/ — the lean worker.py reuses those pure-Python modules.
# main.py / api/ / models/ are the FastAPI + pydantic parts and stay container-only.
# Fresh copy every run so a deleted backend file can't linger in the bundle.
rm -rf services prompts
cp -R "$BACKEND_DIR/services" "$BACKEND_DIR/prompts" .
# Drop bytecode so stale __pycache__ never ships.
find . -type d -name __pycache__ -prune -exec rm -rf {} + 2>/dev/null || true

# CORS gate runs BEFORE deploy so a misconfigured run fails fast and cheap.
DEPLOY_ARGS=()
if [[ -n "${FRONTEND_ORIGIN:-}" ]]; then
  # Override the wrangler.jsonc placeholder so the deployed Worker allows the real
  # frontend. localhost stays in for split local testing against a remote Worker.
  DEPLOY_ARGS+=(--var "ALLOWED_ORIGINS:http://localhost:5173,${FRONTEND_ORIGIN}")
  echo "==> ALLOWED_ORIGINS will include ${FRONTEND_ORIGIN}"
elif [[ "${ALLOW_LOCALHOST_ONLY:-}" == "1" ]]; then
  # Escape hatch for smoke-testing the Worker in isolation before a frontend exists.
  echo "==> ALLOW_LOCALHOST_ONLY=1 — deploying with localhost-only CORS on purpose."
else
  # A live deploy whose CORS blocks the real frontend is worse than no deploy, so
  # this is fatal rather than a warning. The Vercel URL always exists first (its Git
  # integration deploys independently), so FRONTEND_ORIGIN is knowable by this point.
  echo "ERROR: FRONTEND_ORIGIN is unset — the deployed Worker would block the Vercel"
  echo "  frontend via CORS. Re-run with the real origin:"
  echo "    FRONTEND_ORIGIN=https://<your-app>.vercel.app ./infra/deploy-cloudflare.sh"
  echo "  Or, to deploy the Worker alone for a smoke test: ALLOW_LOCALHOST_ONLY=1 ..."
  exit 1
fi

# Deploy in three steps rather than one `pywrangler deploy`, because the vendoring
# leaves build virtualenvs (.venv, .venv-workers) beside the source, and wrangler
# uploads EVERYTHING in the directory — three full copies of the deps would blow the
# 3 MiB free-plan size limit. Only python_modules/ is the runtime package dir.
echo "==> Vendoring Python deps into python_modules/"
uv run pywrangler sync
echo "==> Stripping build virtualenvs so they aren't uploaded (the size killer)"
rm -rf .venv .venv-workers
echo "==> Deploying to Cloudflare (npx wrangler, python_modules only)"
npx --yes wrangler@4 deploy "${DEPLOY_ARGS[@]}"

# Secrets come AFTER the first deploy: `secret put` needs the Worker to already
# exist, and a cold start has to create it here first. Secrets persist across later
# deploys, so this is effectively a no-op once set.
echo "==> Ensuring the NVIDIA_API_KEY secret is set"
if uv run pywrangler secret list 2>/dev/null | grep -q '"name": "NVIDIA_API_KEY"'; then
  echo "    secret already present — leaving it unchanged"
elif [[ -n "${NVIDIA_API_KEY:-}" ]]; then
  echo "    seeding from \$NVIDIA_API_KEY (piped over stdin, never logged)"
  # printf writes to the pipe only; the value never appears in argv or output.
  printf '%s' "$NVIDIA_API_KEY" | uv run pywrangler secret put NVIDIA_API_KEY
else
  echo "    NOTE: no secret set and \$NVIDIA_API_KEY is unset — the Worker is live but"
  echo "    NVIDIA calls will 500 until you run (prompts securely, nothing echoed):"
  echo "        cd infra/cloudflare && uv run pywrangler secret put NVIDIA_API_KEY"
fi

echo "==> Done. Worker URL is printed above; set VITE_API_BASE=<that URL>/api in Vercel."
