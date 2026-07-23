"""Cloudflare Worker entrypoint — lean, framework-free edge handler.

Deliberately NOT FastAPI: loading fastapi+pydantic+starlette in Pyodide exceeds the
free-tier runtime budget (the isolate fails to initialise — errors 1101/1102). This
hand-routes the three endpoints with the raw Workers SDK and reuses the pure-Python
logic the container already has (build_prompt, nvidia_client.generate,
parse_diagram_json, rate_limit). The only import weight here is httpx.

At deploy time the backend source (services/, prompts/) is copied next to this file
by deploy-cloudflare.sh; those copies are gitignored — backend/ stays the source of
truth. The container keeps using FastAPI (backend/main.py); only the edge is lean.
"""

import os
import json
from urllib.parse import urlparse

from workers import WorkerEntrypoint, Response

# Bindings the backend reads through os.getenv. On Workers they arrive on `env`, not
# in os.environ, so copy them across before nvidia_client / CORS read them. Done every
# request (four assignments, negligible) rather than once behind a module flag — env is
# the source of truth, and a per-request copy can never serve stale values from a warm
# isolate.
_ENV_KEYS = ("NVIDIA_API_KEY", "ALLOWED_ORIGINS", "NVIDIA_MAX_MODELS", "NVIDIA_TIMEOUT_S")


def _bridge_env(env):
    for key in _ENV_KEYS:
        value = getattr(env, key, None)
        if value is not None:
            os.environ[key] = str(value)


def _cors_headers(origin: str | None) -> dict:
    """Reflect the request Origin only if it is allow-listed. Mirrors the container's
    CORSMiddleware(allow_credentials=True): credentials require an explicit origin,
    never `*`."""
    headers = {
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
    }
    allowed = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
    if origin and origin in allowed:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Vary"] = "Origin"
    return headers


def _json(data, status: int = 200, extra: dict | None = None) -> Response:
    headers = {"Content-Type": "application/json"}
    if extra:
        headers.update(extra)
    return Response(json.dumps(data), status=status, headers=headers)


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        _bridge_env(self.env)

        method = request.method
        path = urlparse(request.url).path
        # JS Headers is case-insensitive; .get returns None when absent.
        origin = request.headers.get("Origin")
        cors = _cors_headers(origin)

        if method == "OPTIONS":
            return Response("", status=204, headers=cors)

        if path == "/health":
            return _json({"status": "ok"}, extra=cors)

        if path == "/api/health/ollama":
            # Ollama is never reachable from the edge; the client renders this offline
            # state as "Cloud generation available", so no special-casing is needed.
            return _json({"status": "offline", "error": "ollama unavailable at edge"}, extra=cors)

        if path == "/api/generate" and method == "POST":
            # Imported lazily so the health path never pays for httpx/prompt loading.
            from services.rate_limit import allow, client_key

            # rate_limit.allow reads scope["env"]; hand it a minimal scope so the exact
            # same function serves both the container middleware and this worker.
            if not await allow({"env": self.env}, client_key(request.headers)):
                return _json(
                    {"detail": "Rate limit reached — try again in a minute."},
                    status=429,
                    extra={**cors, "Retry-After": "60"},
                )

            try:
                body = await request.json()
                body = body.to_py() if hasattr(body, "to_py") else body

                from services.prompt_engine import build_prompt
                from services.nvidia_client import generate as nvidia_generate
                from services.json_repair import parse_diagram_json

                prompt = build_prompt(
                    body["diagram_type"],
                    body["quest"],
                    body["functional_reqs"],
                    body["non_functional_reqs"],
                    body["design_description"],
                )
                raw = await nvidia_generate(prompt)
                data = parse_diagram_json(raw)

                # Light contract check — the pydantic DiagramResponse the container
                # uses is too heavy for the edge, but the client still needs these.
                for key in ("title", "nodes", "edges"):
                    if key not in data:
                        raise ValueError(f"model response missing '{key}'")
                data.setdefault("diagramType", body["diagram_type"])

                return _json(data, extra=cors)
            except KeyError as e:
                return _json({"detail": f"missing request field: {e}"}, status=422, extra=cors)
            except Exception as e:
                return _json({"detail": str(e)}, status=500, extra=cors)

        return _json({"detail": "Not found"}, status=404, extra=cors)
