DEFAULT_MODEL = "gemma4:e2b"

# dev-note: `ollama` is imported inside the functions, not at module scope. The
# Cloudflare Worker bundle does not ship it (no Emscripten wheel, and a 7GB local
# model is unreachable from the edge anyway), so a top-level import would break
# module_router's import chain on Workers. is_available() catches the ImportError
# and reports offline, which is exactly the "cloud only" state the UI already renders.

# Headroom, not a bugfix. Ollama defaults to 4096 and the diagram prompt alone is
# ~1800-2100 tokens, leaving ~2000 for a 20+ node diagram (~1400 measured) — tight
# enough that a long requirements payload could overrun it.
# dev-note: this does NOT stop mid-object truncation. Measured 2026-07-22: a cut-off
# response came back done_reason=stop at 3495/8192 tokens — gemma4:e2b just emits EOS
# mid-JSON sometimes, and format="json" constrains token *choice*, not stopping.
# json_repair.close_truncated is what actually salvages those.
_NUM_CTX = 8192


async def generate(prompt: str, model: str = DEFAULT_MODEL) -> str:
    import ollama

    client = ollama.AsyncClient()
    response = await client.generate(
        model=model,
        prompt=prompt,
        format="json",
        options={"num_ctx": _NUM_CTX},
    )
    return response.response


async def is_available() -> bool:
    try:
        import ollama

        client = ollama.AsyncClient()
        await client.list()
        return True
    except Exception:
        return False
