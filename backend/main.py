from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes.generate import router as generate_router

app = FastAPI(title="ArchSketch API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
