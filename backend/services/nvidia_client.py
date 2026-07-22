import os
import asyncio

NVIDIA_BASE = "https://integrate.api.nvidia.com/v1"

# Tried first-to-last; first non-empty response wins. This list is the only place
# the online models are named. Latencies below are measured on the REAL diagram
# prompt (2026-07-22), not a toy — toy JSON is a reachability check, not a latency
# one (nemotron did toy JSON in 7s but a real diagram in ~98s). Ordered fastest-first
# so the common case (primary succeeds) is as snappy as possible for a live demo.
# dev-note: models smoked and rejected — deepseek-v4-pro (~90s hang),
# minimaxai/minimax-m3 (>100s), moonshotai/kimi-k2.6 (404, not hosted). Also tested
# working but demoted: nvidia/nemotron-3-ultra-550b-a55b (valid but ~98s — re-add as
# a last rung only if you raise _TIMEOUT_S to ~110s). Smoke any addition on the REAL
# prompt for latency before wiring it.
NVIDIA_MODELS = [
    "mistralai/mistral-small-4-119b-2603",  # primary: fastest (~12s), full-quality output
    "z-ai/glm-5.2",                         # ~33s, most-proven / strongest JSON
    "thinkingmachines/inkling",             # ~37s
    "minimaxai/minimax-m2.7",               # ~38s (NB: m2.7 works; m3 times out)
]

# Per-request cap so a stalled model fails over to the next instead of freezing the
# whole request. Every wired model finishes in <40s on the real prompt, so 75s is
# ~2x headroom for a heavier prompt while still failing over promptly. Ollama is the
# net if all four fail.
_TIMEOUT_S = 75.0

_SYSTEM = (
    "You are a system-design diagram generator. Respond ONLY with a single valid "
    "JSON object — no prose, no markdown fences."
)


async def generate(prompt: str) -> str:
    """Generate a raw JSON diagram string via NVIDIA NIM (OpenAI-compatible).

    Tries each model in NVIDIA_MODELS until one returns a non-empty body; raises
    RuntimeError with every model's error if all fail, so the router can fall back
    to Ollama. Runs the sync SDK in an executor to stay non-blocking, matching the
    async contract the rest of the app expects.
    """
    try:
        from openai import OpenAI
    except ImportError:
        raise RuntimeError("openai not installed. Run: uv add openai")

    api_key = os.getenv("NVIDIA_API_KEY", "")
    if not api_key:
        raise RuntimeError("NVIDIA_API_KEY environment variable not set")

    # max_retries=0: the loop below is our fallback mechanism, so the SDK must not
    # burn 2 extra retries (up to 3×_TIMEOUT_S) on a stalled model before we move on.
    client = OpenAI(base_url=NVIDIA_BASE, api_key=api_key, timeout=_TIMEOUT_S, max_retries=0)
    loop = asyncio.get_event_loop()
    errors: list[str] = []

    for model in NVIDIA_MODELS:
        try:
            resp = await loop.run_in_executor(
                None,
                # m=model binds per-iteration; a bare `model` would late-bind to the last.
                lambda m=model: client.chat.completions.create(
                    model=m,
                    messages=[
                        {"role": "system", "content": _SYSTEM},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.2,
                    # dev-note: assumes every model above supports json_object mode.
                    # A model that doesn't will 400 and fall through to the next —
                    # acceptable here; add a plain-retry per model only if that ever bites.
                    response_format={"type": "json_object"},
                ),
            )
            text = (resp.choices[0].message.content or "").strip() if resp.choices else ""
            if text:
                return text
            errors.append(f"{model}: empty response")
        except Exception as e:
            errors.append(f"{model}: {e}")

    raise RuntimeError("All NVIDIA models failed. " + "; ".join(errors))


if __name__ == "__main__":
    # Smoke: proves the NVIDIA path is reachable end to end (needs NVIDIA_API_KEY).
    out = asyncio.run(generate('Return {"ok": true} and nothing else.'))
    print(out)
    assert "ok" in out, f"unexpected body: {out!r}"
    print("nvidia_client smoke OK")
