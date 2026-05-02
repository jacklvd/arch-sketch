import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes.generate import router as generate_router

_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
ALLOWED_ORIGINS = [o.strip() for o in _origins_env.split(",") if o.strip()]

app = FastAPI(title="ArchSketch API", version="0.1.0")

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
    try:
        import ollama as ol
        client = ol.AsyncClient()
        resp = await client.list()
        models = [m.model for m in resp.models]
        return {"status": "online", "models": models}
    except Exception as e:
        return {"status": "offline", "error": str(e)}
