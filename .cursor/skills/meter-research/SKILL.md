---
name: meter-research
description: Live fact-checking for METER using Tavily and TinyFish. Use when verifying Binance Agent OS, x402, contest rules, or updating FACT_CHECK.md. Triggers on research, fact-check, Tavily, TinyFish.
---

# METER Live Research Skill

## Keys

- `TAVILY_API_KEY` → `https://api.tavily.com/search`
- `TINYFISH_API_KEY` → Search `GET https://api.search.tinyfish.ai?query=` and Fetch `POST https://api.fetch.tinyfish.ai` with `{ "urls": [...] }`
- Header for TinyFish: `X-API-Key`
- TinyFish **Agent** automation needs wallet credits; Search/Fetch stay free at $0 balance
- Never paste keys into chat or commits

## Workflow

1. Run Tavily advanced search with `include_answer: true`
2. Cross-check with TinyFish Search
3. Fetch primary sources with TinyFish Fetch (`ttl: 0` for live)
4. Write verified / disputed / unknown into `memory/FACT_CHECK.md`
5. Save sanitized JSON under `memory/research-raw/live/`

## AgentRouter

- Base `https://co.agentrouter.org/v1` + Bearer key (official; `agentrouter.org` is Aliyun-WAF gated from many cloud IPs)
- If Aliyun WAF captcha HTML returns: record as blocked, do **not** fake LLM output
- Optional backup: `VENICE_API_KEY` when provided

## aftercut folder

If `aftercut` AgentRouter integration notes are missing from this machine, use public AgentRouter docs + `grounds_lib/llm.py` / `src/meter/clients/llm.ts` until the user uploads them.
