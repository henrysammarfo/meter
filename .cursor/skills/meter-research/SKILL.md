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

## AgentRouter (AFTERCUT)

- Base: `https://agentrouter.org` (`AGENT_ROUTER_BASE` / `AGENT_ROUTER_ANTHROPIC_BASE`) — **not** api.anthropic.com / api.openai.com
- Key order: `AGENT_ROUTER_API_KEY` → `ANTHROPIC_AUTH_TOKEN` → `ANTHROPIC_API_KEY` (also `AGENTROUTER_API_KEY`)
- Every request MUST send Claude Code wire-image headers (`claude-cli/2.1.158`, anthropic-beta, x-app=cli, stainless, Bearer + x-api-key)
- Claude: `POST {base}/v1/messages?beta=true` · GPT/DeepSeek: `POST {base}/v1/chat/completions`
- Client: `src/meter/clients/agent-router.ts` (`liveChat`, `claudeCodeHeaders`)
- If Aliyun WAF captcha HTML returns: record as blocked, do **not** fake LLM output and do **not** invent native Anthropic/OpenAI keys
- Smoke: `npm run smoke:agentrouter` → prints only `{ok, model, status}`

