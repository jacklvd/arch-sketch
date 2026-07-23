import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from api.routes.generate import router as generate_router
from services.rate_limit import allow, client_key

_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
ALLOWED_ORIGINS = [o.strip() for o in _origins_env.split(",") if o.strip()]

# Only the endpoint that spends NVIDIA quota is metered; health checks are free.
_METERED_PATHS = {"/api/generate"}

app = FastAPI(title="ArchSketch API", version="0.1.0")


# Registered BEFORE CORSMiddleware on purpose. Starlette builds the stack so that
# the LAST middleware added is the OUTERMOST — so adding CORS after this leaves CORS
# on the outside, and the 429 below comes back with Access-Control-Allow-Origin on it.
# Reverse the two and the browser reports an opaque CORS failure instead of the real
# "rate limited" message, which is a miserable thing to debug.
@app.middleware("http")
async def rate_limit(request: Request, call_next):
    if request.url.path in _METERED_PATHS:
        if not await allow(request.scope, client_key(request.headers)):
            return JSONResponse(
                {"detail": "Rate limit reached — try again in a minute."},
                status_code=429,
                # Advisory only: the binding is a fixed window, so this is the
                # worst-case wait rather than a computed one.
                headers={"Retry-After": "60"},
            )
    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/health/ollama")
async def ollama_health():
    # Always "offline" on the Worker — the SDK is not bundled and a 7GB local model
    # is unreachable from the edge. The client already renders that as
    # "Cloud generation available", so this needs no deployment-specific branch.
    try:
        import ollama as ol
        client = ol.AsyncClient()
        resp = await client.list()
        models = [m.model for m in resp.models]
        return {"status": "online", "models": models}
    except Exception as e:
        return {"status": "offline", "error": str(e)}
