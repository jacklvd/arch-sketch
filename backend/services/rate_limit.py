"""Per-IP rate limiting via the Cloudflare Workers rate-limit binding.

No-ops when the binding is absent, so the same app runs in the container (where
there is nothing to enforce and no shared edge state to enforce it with) and on
Workers (where it is the thing standing between a scraper and the free-tier quota).

What is actually being protected is NVIDIA quota, not Cloudflare's 100k requests
/day — one /api/generate is one model call, so that endpoint is the only one worth
metering. The static client is served from Vercel and never touches this Worker.
"""

import logging

logger = logging.getLogger(__name__)

# Must match the `ratelimits[].name` in wrangler.jsonc.
BINDING = "GENERATE_LIMIT"


def client_key(headers) -> str:
    """Rate-limit bucket for a request.

    Only CF-Connecting-IP is trusted — Cloudflare sets it at the edge and a client
    cannot forge it. X-Forwarded-For is deliberately NOT consulted: it is
    caller-supplied, so honouring it would hand every scraper an unlimited supply
    of fresh buckets. Missing header falls back to one shared bucket, which throttles
    rather than exempts.
    """
    return headers.get("cf-connecting-ip") or "unattributed"


async def allow(scope, key: str) -> bool:
    """True if this request is within budget. Fails open."""
    env = scope.get("env")
    limiter = getattr(env, BINDING, None) if env is not None else None
    if limiter is None:
        return True  # not running on Workers — no binding, nothing to meter

    try:
        # Imported here, not at module scope: these modules only exist inside the
        # Workers Python runtime, and this file is imported by the container too.
        from js import Object
        from pyodide.ffi import to_js

        outcome = await limiter.limit(to_js({"key": key}, dict_converter=Object.fromEntries))
        return bool(outcome.success)
    except Exception as e:
        # An unavailable limiter must not take the API down with it. print (not
        # logging) so it actually reaches `wrangler tail` — Python logging has no
        # handler in the Worker runtime — making a silent fail-open visible.
        print(f"rate limiter unavailable ({type(e).__name__}: {e}) — allowing request")
        return True


if __name__ == "__main__":
    import asyncio

    # The binding path needs the Workers runtime; `wrangler dev` covers it. What is
    # checkable here is the part that would silently disable protection: trusting a
    # spoofable header, or the container path throwing instead of no-opping.
    assert client_key({"cf-connecting-ip": "203.0.113.7"}) == "203.0.113.7"
    assert client_key({"x-forwarded-for": "1.2.3.4"}) == "unattributed", "XFF must not be trusted"
    assert client_key({}) == "unattributed"

    assert asyncio.run(allow({}, "k")) is True, "no scope env -> allow"
    assert asyncio.run(allow({"env": object()}, "k")) is True, "no binding on env -> allow"

    class Broken:
        GENERATE_LIMIT = "not-a-binding"

    assert asyncio.run(allow({"env": Broken()}, "k")) is True, "broken binding must fail open"
    print("rate_limit OK")
