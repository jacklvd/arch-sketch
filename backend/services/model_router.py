import logging
from services.ollama_client import generate as ollama_generate, is_available as ollama_available
from services.gemini_client import generate as gemini_generate
from services.json_repair import parse_diagram_json
from models.diagram import DiagramResponse

logger = logging.getLogger(__name__)


async def route_and_generate(prompt: str) -> DiagramResponse:
    gemini_error: Exception | None = None

    try:
        logger.info("Routing to Gemini (gemini-2.5-flash)...")
        raw = await gemini_generate(prompt)
        data = parse_diagram_json(raw)
        return DiagramResponse(**data)
    except Exception as e:
        gemini_error = e
        logger.warning("Gemini failed: %s — falling back to Ollama", e)

    if await ollama_available():
        try:
            logger.info("Routing to Ollama (gemma4:e2b)...")
            raw = await ollama_generate(prompt)
            data = parse_diagram_json(raw)
            return DiagramResponse(**data)
        except Exception as e:
            raise RuntimeError(
                f"Both models failed. Gemini: {gemini_error}. Ollama: {e}"
            ) from e

    raise RuntimeError(
        f"Gemini unavailable and Ollama not reachable. Gemini error: {gemini_error}"
    )
