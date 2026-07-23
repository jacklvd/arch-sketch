import os
import asyncio
import httpx

NVIDIA_BASE = "https://integrate.api.nvidia.com/v1"

# Tried first-to-last; first non-empty response wins. This list is the only place
# the online models are named. Latencies below are measured on the REAL diagram
# prompt (2026-07-22), not a toy — toy JSON is a reachability check, not a latency
# one (nemotron did toy JSON in 7s but a real diagram in ~98s). Ordered fastest-first
# so the common case (primary succeeds) is as snappy as possible for a live demo.
# dev-note: models smoked and rejected — deepseek-v4-pro (~90s hang),
# minimaxai/minimax-m3 (>100s), moonshotai/kimi-k2.6 (404, not hosted). Also tested
# working but demoted: nvidia/nemotron-3-ultra-550b-a55b (valid but ~98s — re-add as
# a last rung only if you raise NVIDIA_TIMEOUT_S to ~110s). Smoke any addition on the
# REAL prompt for latency before wiring it.
NVIDIA_MODELS = [
    "mistralai/mistral-small-4-119b-2603",  # primary: fastest (~12s), full-quality output
    "z-ai/glm-5.2",                         # ~33s, most-proven / strongest JSON
    "thinkingmachines/inkling",             # ~37s
    "minimaxai/minimax-m2.7",               # ~38s (NB: m2.7 works; m3 times out)
]

# How far down NVIDIA_MODELS a single request may walk. The ceiling is
# MAX_MODELS * _TIMEOUT_S, and a browser tab that spins for five minutes has
# already lost the user — two rungs (120s worst case, ~12s typical) covers the
# realistic failure of the primary stalling. docker-compose sets 4 locally so the
# full chain still gets exercised in dev.
MAX_MODELS = max(1, int(os.getenv("NVIDIA_MAX_MODELS", "2")))

# Per-request cap so a stalled model fails over to the next instead of freezing the
# whole request. Every wired model finishes in <40s on the real prompt, so 60s is
# ~1.5x headroom for a heavier prompt while still failing over promptly.
_TIMEOUT_S = float(os.getenv("NVIDIA_TIMEOUT_S", "60"))

_SYSTEM = (
    "You are a system-design diagram generator. Respond ONLY with a single valid "
    "JSON object — no prose, no markdown fences."
)


async def generate(prompt: str) -> str:
    """Generate a raw JSON diagram string via NVIDIA NIM (OpenAI-compatible).

    Tries each model in NVIDIA_MODELS[:MAX_MODELS] until one returns a non-empty
    body; raises RuntimeError with every model's error if all fail, so the router
    can fall back to Ollama.

    Uses httpx rather than the openai SDK deliberately: the endpoint is a plain
    OpenAI-shaped POST, and Cloudflare Python Workers support only *async* HTTP
    clients (aiohttp/httpx) — the sync `OpenAI` client cannot be bridged to the
    Fetch API, so this is what lets the Worker and the container share one file.
    """
    api_key = os.getenv("NVIDIA_API_KEY", "")
    if not api_key:
        raise RuntimeError("NVIDIA_API_KEY environment variable not set")

    errors: list[str] = []
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    async with httpx.AsyncClient(timeout=_TIMEOUT_S) as client:
        for model in NVIDIA_MODELS[:MAX_MODELS]:
            try:
                # dev-note: asyncio.wait_for on top of the httpx timeout, because on
                # Workers httpx runs through an FFI shim to fetch() whose timeout
                # honouring is unverified. Failover is the whole point of the loop,
                # so the cap gets enforced on our side too. Drop if it ever proves
                # redundant on both runtimes.
                resp = await asyncio.wait_for(
                    client.post(
                        f"{NVIDIA_BASE}/chat/completions",
                        headers=headers,
                        json={
                            "model": model,
                            "messages": [
                                {"role": "system", "content": _SYSTEM},
                                {"role": "user", "content": prompt},
                            ],
                            "temperature": 0.2,
                            # dev-note: assumes every model above supports json_object
                            # mode. One that doesn't will 400 and fall through to the
                            # next — acceptable here; add a plain-retry per model only
                            # if that ever bites.
                            "response_format": {"type": "json_object"},
                        },
                    ),
                    timeout=_TIMEOUT_S,
                )
                resp.raise_for_status()
                choices = resp.json().get("choices") or []
                text = (choices[0]["message"]["content"] or "").strip() if choices else ""
                if text:
                    return text
                errors.append(f"{model}: empty response")
            except Exception as e:
                # Never interpolate the response body here — a provider error can
                # echo the request, and this string reaches the client as a 500.
                errors.append(f"{model}: {type(e).__name__}: {e}")

    raise RuntimeError("All NVIDIA models failed. " + "; ".join(errors))


if __name__ == "__main__":
    # Smoke: proves the NVIDIA path is reachable end to end (needs NVIDIA_API_KEY).
    out = asyncio.run(generate('Return {"ok": true} and nothing else.'))
    print(out)
    assert "ok" in out, f"unexpected body: {out!r}"
    print("nvidia_client smoke OK")
