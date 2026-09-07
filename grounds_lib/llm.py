/**
 * Python-compatible note: TS AgentRouter client lives in src/meter/clients/llm.ts.
 * This module mirrors metering hooks for grounds scripts.
 */
from __future__ import annotations

import os
import json
import urllib.request


class MeterLlmError(RuntimeError):
    pass


def chat(messages: list[dict], max_tokens: int = 800) -> str:
    api_key = os.environ.get("AGENTROUTER_API_KEY")
    if not api_key:
        raise MeterLlmError("Missing AGENTROUTER_API_KEY — no OpenAI fallback")
    base = os.environ.get("AGENTROUTER_BASE_URL", "https://agentrouter.org/v1").rstrip("/")
    model = os.environ.get("AGENTROUTER_MODEL", "gpt-4o-mini")
    req = urllib.request.Request(
        f"{base}/chat/completions",
        data=json.dumps(
            {"model": model, "messages": messages, "max_tokens": max_tokens}
        ).encode(),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "OpenAI/Python 1.0",
            "x-stainless-lang": "python",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        body = resp.read().decode()
    if "aliyun_waf" in body:
        raise MeterLlmError("AgentRouter WAF captcha — no fallback")
    data = json.loads(body)
    content = data["choices"][0]["message"]["content"]
    return content
