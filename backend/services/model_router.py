import logging
from services.ollama_client import generate as ollama_generate, is_available as ollama_available
from services.gemini_client import generate as gemini_generate
from services.json_repair import parse_diagram_json
from models.diagram import DiagramResponse

logger = logging.getLogger(__name__)


async def route_and_generate(prompt: str) -> DiagramResponse:
    ollama_error: Exception | None = None

    if await ollama_available():
        try:
            logger.info("Routing to Ollama (gemma4:e4b)...")
            raw = await ollama_generate(prompt)
            data = parse_diagram_json(raw)
            return DiagramResponse(**data)
        except Exception as e:
            ollama_error = e
            logger.warning("Ollama failed: %s — falling back to Gemini", e)

    try:
        logger.info("Routing to Gemini (gemini-2.5-flash)...")
        raw = await gemini_generate(prompt)
        data = parse_diagram_json(raw)
        return DiagramResponse(**data)
    except RuntimeError as e:
        # Gemini not configured — surface a clear message
        if ollama_error:
            raise RuntimeError(
                f"Both models failed. Ollama: {ollama_error}. Gemini: {e}"
            ) from e
        raise
