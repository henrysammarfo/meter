# METER — Current State

**Updated:** 2026-09-05  
**Branch:** `cursor/meter-bible-live-architecture-b2de`  
**Phase:** LIVE HARDENING (prepaid research path green; Binance/Venice keys still outstanding)

## What exists

- Marketing + brand + dashboard (Lovable / TanStack Start)
- Live `/api/v1/*` in `src/meter/*` via `src/server.ts`
- Durable ledger + waitlist under `data/` (gitignored)
- Paid `/api/v1/research` → 402 or prepaid debit → **Tavily + TinyFish Search + TinyFish Fetch**
- Optional LLM synthesis only when `METER_LLM_PROVIDER` + key set and `synthesize=1`
- Venice client (explicit provider) + Binance facilitator client (fail-closed until keyed)
- Operator auth, rate limits, idempotency, OpenAPI + MCP skill catalog
- Smoke: `npm run smoke` (`scripts/smoke-meter.mjs`)

## Live providers (this host)

| Provider | Status | Notes |
|---|---|---|
| Tavily | **OK** | Required for research |
| TinyFish Search/Fetch | **OK** | Required for research |
| TinyFish Agent | **Blocked** | 0 credits |
| AgentRouter | **PONG OK via proxy egress** | AFTERCUT client + `AGENT_ROUTER_HTTP_PROXY`; AWS us-east direct = Aliyun WAF |
| Venice | **Missing key** | Set `METER_LLM_PROVIDER=venice` + `VENICE_API_KEY` |
| Binance Agent OS | **Missing key** | Required for production Binance settle |
| On-chain x402 | **Unconfigured** | Needs `METER_PAY_TO` + `METER_USDC_ASSET` |

## Contest (Track A)

- Prize: $20,000 USDC · Deadline: **2026-09-08 23:59 UTC**
- Residual risk documented — never claim unhackable

## Next (needs owner keys)

1. `BINANCE_AGENT_OS_API_KEY` + `BINANCE_X402_FACILITATOR_URL`
2. Refresh AgentRouter key in `.env` and re-run `npm run smoke:agentrouter` from an egress that clears Aliyun (AFTERCUT headers already wired)
3. Optional `VENICE_API_KEY` only if owner chooses Venice explicitly (`METER_LLM_PROVIDER=venice`) — never as silent AgentRouter substitute
4. `METER_PAY_TO` + `METER_USDC_ASSET` for on-chain settle
5. `METER_OPERATOR_KEY` before production lock
6. Demo video + X quote (owner)
