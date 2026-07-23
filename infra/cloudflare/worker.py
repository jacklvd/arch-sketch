"""Cloudflare Worker entrypoint — a thin ASGI bridge to the SAME FastAPI app the
Docker container runs (backend/main.py). No business logic lives here.

At deploy time the backend source (main.py, api/, models/, services/, prompts/) is
copied next to this file by deploy-cloudflare.sh, so `import main` resolves and the
prompt templates load via their normal relative Path. Those copied files are
gitignored — backend/ stays the one source of truth.
"""

import os
from workers import WorkerEntrypoint
import asgi

# Bindings the backend reads through os.getenv. On Workers these arrive on `env`,
# NOT in os.environ, so they must be copied across before any backend module runs.
# NVIDIA_API_KEY is a secret (wrangler secret put); the rest are plain vars.
_ENV_KEYS = ("NVIDIA_API_KEY", "ALLOWED_ORIGINS", "NVIDIA_MAX_MODELS", "NVIDIA_TIMEOUT_S")

# Built lazily on the first request: main.py reads ALLOWED_ORIGINS at *import* time to
# configure CORS, and env is only available once a request arrives — so the import
# has to wait until after the bridge below has run, then is cached for reuse.
_app = None


def _get_app(env):
    global _app
    if _app is None:
        for key in _ENV_KEYS:
            value = getattr(env, key, None)
            if value is not None:
                os.environ[key] = str(value)
        from main import app  # noqa: E402 — deliberately after the env bridge
        _app = app
    return _app


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        app = _get_app(self.env)
        # self.env is also placed on scope["env"] so services/rate_limit.py can reach
        # the GENERATE_LIMIT binding, which is an object (not a string) and therefore
        # cannot ride through os.environ.
        return await asgi.fetch(app, request, self.env)
