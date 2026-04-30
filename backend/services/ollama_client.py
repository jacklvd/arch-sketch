import ollama

DEFAULT_MODEL = "gemma4:e4b"


async def generate(prompt: str, model: str = DEFAULT_MODEL) -> str:
    client = ollama.AsyncClient()
    response = await client.generate(
        model=model,
        prompt=prompt,
        format="json",
    )
    return response.response


async def is_available() -> bool:
    try:
        client = ollama.AsyncClient()
        await client.list()
        return True
    except Exception:
        return False
