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
# Fresh copy every run so a deleted backend file can't linger in the bundle.
rm -rf main.py api models services prompts
cp "$BACKEND_DIR/main.py" .
cp -R "$BACKEND_DIR/api" "$BACKEND_DIR/models" "$BACKEND_DIR/services" "$BACKEND_DIR/prompts" .
# Drop bytecode so stale __pycache__ never ships.
find . -type d -name __pycache__ -prune -exec rm -rf {} + 2>/dev/null || true

echo "==> Ensuring the NVIDIA_API_KEY secret is set"
# `wrangler secret list` prints only names, never values.
if uv run wrangler secret list 2>/dev/null | grep -q '"name": "NVIDIA_API_KEY"'; then
  echo "    secret already present — leaving it unchanged"
elif [[ -n "${NVIDIA_API_KEY:-}" ]]; then
  echo "    seeding from \$NVIDIA_API_KEY (piped over stdin, not logged)"
  # printf writes to the pipe only; the value never appears in argv or output.
  printf '%s' "$NVIDIA_API_KEY" | uv run wrangler secret put NVIDIA_API_KEY
else
  echo "    no secret found and \$NVIDIA_API_KEY is unset."
  echo "    Run this once (it prompts securely, nothing is echoed):"
  echo "        cd infra/cloudflare && uv run wrangler secret put NVIDIA_API_KEY"
  exit 1
fi

DEPLOY_ARGS=()
if [[ -n "${FRONTEND_ORIGIN:-}" ]]; then
  # Override the wrangler.jsonc placeholder so the deployed Worker allows the real
  # frontend. localhost stays in for split local testing against a remote Worker.
  DEPLOY_ARGS+=(--var "ALLOWED_ORIGINS:http://localhost:5173,${FRONTEND_ORIGIN}")
  echo "==> ALLOWED_ORIGINS will include ${FRONTEND_ORIGIN}"
else
  echo "==> WARNING: FRONTEND_ORIGIN unset — deployed CORS allows only localhost."
  echo "    Re-run with FRONTEND_ORIGIN=https://<your-app>.vercel.app to fix prod CORS."
fi

echo "==> Deploying to Cloudflare (pywrangler → wrangler)"
uv run pywrangler deploy "${DEPLOY_ARGS[@]}"

echo "==> Done. Worker URL is printed above; append /api for the client's VITE_API_BASE."
