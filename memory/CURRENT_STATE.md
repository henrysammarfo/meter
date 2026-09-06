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

## Contest (Agent OS Mini Hackathon)

- **Hub:** https://www.binance.com/en/agent-os
- **Total pool:** $60,000 USDC · Deadline: **2026-09-08 23:59 UTC**
- **Track A (METER target):** $20,000 USDC — tiers per owner paste: $2k / $1.5k / $1k / next 50 × $300
- **Track B (optional parallel):** $40,000 USDC — first 10k eligible MCP+trade × $4 (not our primary win thesis)
- **Submit:** Follow @Binance · repost · quote/reply (demo video + GitHub) · survey
- Residual risk documented — never claim unhackable

## API keys / Agent OS access — slow path (owner confirms each step)

Two different surfaces (do not mix):

| Surface | How you get in | Needed for METER |
|---|---|---|
| **Binance MCP** (`https://agent.binance.com/mcp/agentic`) | Login Binance.com → OAuth in Claude/Cursor/Codex — **no API key file** | Track A demo “Agent OS connected” + optional Track B $4 |
| **B402 / x402 merchant** (`/papi/v2/b402/*`) | Partner apply (Google Form / support) + RSA + IP allowlist | Real pay/settle / Bazaar listing |

| Step | Status | What |
|---|---|---|
| 1a | **DONE** | Owner opened Agent OS + official MCP docs (`developers.binance.com/.../mcp-server/agentic`) |
| 1b | **BLOCKED / ALT** | B402 apply form (`forms.gle`) blocked → long Google URL or Binance support for Sandbox merchant |
| 1c | **DONE (VS Code)** | Owner connected `https://mcp.binance.com/mcp/agentic`; live BTCUSDT smoke OK |
| 2 | Pending | RSA-1024 for B402 merchant (only after apply path open) |
| 3+ | Pending | Sandbox `clientId`/`accessToken`/base URL → rewrite B402 client → Production pay-to |

Official apply: [developers.binance.com …/6.apply-developer-account](https://developers.binance.com/docs/products/onchainpay-x402/basics/6.apply-developer-account) · Form: https://forms.gle/aUQvxUETfGMzyTky5

## Next (needs owner keys)

1. Binance B402 partner credentials (Sandbox then Production) → map to `BINANCE_AGENT_OS_API_KEY` + `BINANCE_X402_FACILITATOR_URL` (base URL from onboarding)
2. AgentRouter already PONG-green via proxy; keep `AGENT_ROUTER_HTTP_PROXY` healthy
3. Optional `VENICE_API_KEY` only if owner chooses Venice explicitly
4. `METER_PAY_TO` + `METER_USDC_ASSET` (B402 Production = BSC mainnet per Binance docs — not Base Sepolia)
5. Confirm `METER_OPERATOR_KEY` before production lock
6. Demo video + X quote (owner)

## Known integration gap (docs-verified)

`src/meter/clients/binance.ts` still uses Bearer `/verify` `/settle`. Official B402 V2 requires RSA-SHA256 + `X-Tesla-*` headers on `/papi/v2/b402/{supported,verify,settle}`. Rewrite after Sandbox credentials — fail-closed until then. Study notes: `memory/research-raw/binance-b402/NOTES.md`.


## 2026-09-06 10:17 UTC
- Step 1d DONE: Agentic sub readable, all balances 0. No funding yet.
- Next Step 2: B402 RSA-1024 keypair generation (local; do not paste private key).


## 2026-09-06 10:19 UTC API key progress
- Step 2 RSA: **DONE** (agent-generated, gitignored)
- B402 Form: **BLOCKED** for owner → use Live Chat template
- Next Step 2b: owner sends support ticket + provides testnet `0x` wallet + email


## 2026-09-06 10:26 UTC — Settle strategy lock
- MCP: DONE (VS Code)
- Prepaid settle: LIVE (primary demo)
- Binance B402 merchant form: BLOCKED → not required for Track A demo
- Optional next: owner `METER_PAY_TO` for x402.org Base Sepolia
- Self-build facilitator: deferred (risk/time); not needed to differentiate vs Tollgate
