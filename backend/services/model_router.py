import logging
from services.ollama_client import generate as ollama_generate, is_available as ollama_available
from services.nvidia_client import generate as nvidia_generate, NVIDIA_MODELS
from services.json_repair import parse_diagram_json
from models.diagram import DiagramResponse

logger = logging.getLogger(__name__)


async def route_and_generate(prompt: str) -> DiagramResponse:
    nvidia_error: Exception | None = None

    try:
        logger.info("Routing to NVIDIA NIM (%s + fallbacks)...", NVIDIA_MODELS[0])
        raw = await nvidia_generate(prompt)
        data = parse_diagram_json(raw)
        return DiagramResponse(**data)
    except Exception as e:
        nvidia_error = e
        logger.warning("NVIDIA failed: %s — falling back to Ollama", e)

    if await ollama_available():
        try:
            logger.info("Routing to Ollama (gemma4:e2b)...")
            raw = await ollama_generate(prompt)
            data = parse_diagram_json(raw)
            return DiagramResponse(**data)
        except Exception as e:
            raise RuntimeError(
                f"Both providers failed. NVIDIA: {nvidia_error}. Ollama: {e}"
            ) from e

    raise RuntimeError(
        f"NVIDIA unavailable and Ollama not reachable. NVIDIA error: {nvidia_error}"
    )
