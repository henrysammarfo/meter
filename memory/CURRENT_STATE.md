# METER — Current State

**Updated:** 2026-09-05  
**Branch:** `cursor/meter-bible-live-architecture-b2de`  
**Phase:** API KEYS — owner step-by-step (Step 1: B402 Sandbox apply). Prepaid research green; AgentRouter PONG via proxy.

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

## API keys — slow path (owner confirms each step)

| Step | Status | What |
|---|---|---|
| 1 | **WAITING OWNER** | Open B402 apply docs + form; choose **Sandbox first**; do not submit yet |
| 2+ | Pending | RSA keypair → form submit → Sandbox `clientId`/`accessToken` → wire `.env` → Production apply → `METER_PAY_TO` / USDC → operator lock |

Official apply: [developers.binance.com …/6.apply-developer-account](https://developers.binance.com/docs/products/onchainpay-x402/basics/6.apply-developer-account) · Form: https://forms.gle/aUQvxUETfGMzyTky5

## Next (needs owner keys)

1. Binance B402 partner credentials (Sandbox then Production) → map to `BINANCE_AGENT_OS_API_KEY` + `BINANCE_X402_FACILITATOR_URL` (base URL from onboarding)
2. AgentRouter already PONG-green via proxy; keep `AGENT_ROUTER_HTTP_PROXY` healthy
3. Optional `VENICE_API_KEY` only if owner chooses Venice explicitly
4. `METER_PAY_TO` + `METER_USDC_ASSET` (B402 Production = BSC mainnet per Binance docs — not Base Sepolia)
5. Confirm `METER_OPERATOR_KEY` before production lock
6. Demo video + X quote (owner)
