import os
import asyncio

GEMINI_MODEL = "gemini-2.5-flash"


async def generate(prompt: str) -> str:
    try:
        from google import genai
    except ImportError:
        raise RuntimeError(
            "google-genai not installed. Run: poetry add google-genai"
        )

    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable not set")

    client = genai.Client(api_key=api_key)
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        ),
    )
    return response.text
