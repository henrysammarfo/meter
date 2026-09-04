# METER — Current State

**Updated:** 2026-09-04  
**Branch:** `cursor/meter-bible-live-architecture-b2de`  
**Phase:** BUILDING → POLISH (live API wired; Binance facilitator credentials still outstanding)

## What exists

- Marketing + brand + dashboard UI (Lovable / TanStack Start)
- **Live** `/api/v1/*` surface in `src/meter/*` dispatched from `src/server.ts`
- Durable ledger at `data/ledger.json` (gitignored)
- Paid `/api/v1/research` → 402 or prepaid debit → **Tavily + TinyFish Search** (live)
- Invoice issuance from unbilled receipts
- Flovia overview derived only from ledger
- Cursor rules + skills under `.cursor/`
- Memory + research dumps under `memory/`

## Live providers (this host)

| Provider | Status | Notes |
|---|---|---|
| Tavily | **OK** | Search works |
| TinyFish Search | **OK** | Free |
| TinyFish Fetch | **OK** | Free |
| TinyFish Agent | **Blocked** | Key valid, **0 credits** |
| AgentRouter | **Blocked** | Aliyun WAF captcha from this egress; `co.agentrouter.org` → Invalid API Key |
| Venice | **Missing key** | Mentioned by owner, not provided |
| Binance Agent OS API | **Missing key** | Required for production Binance settle |
| On-chain x402 (`METER_PAY_TO`) | **Unconfigured** | Prepaid sandbox path is live |

## Contest (Track A)

- Prize: $20,000 USDC · Deadline: **2026-09-08 23:59 UTC**
- Submit: follow @Binance · repost · quote (demo + GitHub) · survey
- Geo: US/UK/EEA/HK/SG blocked (HackList + secondary reports)

## Residual risk (honest)

Not unhackable. See `FACT_CHECK.md` security section. File ledger is single-host; facilitator trust; key rotation after chat paste; WAF/egress issues.

## Next to raise win chance

1. Wire Binance x402 facilitator + Agentic Wallet when keys arrive  
2. Fund TinyFish Agent credits **or** keep Search/Fetch-only enrichment  
3. Unblock AgentRouter (residential egress / Venice key) for optional synthesis  
4. Demo video + GitHub + X quote before deadline  
5. Upload stage Bible + aftercut AgentRouter notes when available  
