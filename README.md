# METER

<p align="center">
  <img src="./public/banner-meter.svg" alt="METER — The ledger for agent money" width="100%" />
</p>

<p align="center">
  <a href="https://www.binance.com/en/agent-os"><img src="https://img.shields.io/badge/Binance-Agent_OS_Track_A-F0B90B?style=for-the-badge&logo=binance&logoColor=black" alt="Binance Agent OS Track A" /></a>
  <a href="https://youtu.be/eqBMozL5CgU"><img src="https://img.shields.io/badge/Demo-Video-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="Demo Video" /></a>
  <a href="https://meter-sooty.vercel.app/demo"><img src="https://img.shields.io/badge/Live-Demo-C8F542?style=for-the-badge&logo=vercel&logoColor=black" alt="Live Demo" /></a>
  <a href="https://meter-sooty.vercel.app/api/v1/health"><img src="https://img.shields.io/badge/Health-ok_live-22C55E?style=for-the-badge" alt="Health live" /></a>
  <a href="./SUBMIT.md"><img src="https://img.shields.io/badge/Contest-Submit_kit-0A0A0A?style=for-the-badge" alt="Submit kit" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Settle-Prepaid_live-111827?style=flat-square" alt="Prepaid live" />
  <img src="https://img.shields.io/badge/x402-402_Payment_Required-111827?style=flat-square" alt="x402" />
  <img src="https://img.shields.io/badge/Providers-Tavily_+_TinyFish-111827?style=flat-square" alt="Providers" />
  <img src="https://img.shields.io/badge/Cap-$20%2Fday-111827?style=flat-square" alt="Daily cap" />
  <img src="https://img.shields.io/badge/Doctrine-No_mocks-111827?style=flat-square" alt="No mocks" />
  <a href="https://meter-sooty.vercel.app/api/v1/openapi.json"><img src="https://img.shields.io/badge/OpenAPI-json-111827?style=flat-square" alt="OpenAPI" /></a>
  <a href="https://meter-sooty.vercel.app/api/v1/mcp/skills"><img src="https://img.shields.io/badge/MCP-skills_catalog-111827?style=flat-square" alt="MCP skills" /></a>
</p>

**Production:** https://meter-sooty.vercel.app · **Demo:** https://meter-sooty.vercel.app/demo · **Video:** https://youtu.be/eqBMozL5CgU · **GitHub:** https://github.com/henrysammarfo/meter

> When agents pay each other or charge for an API call, **METER** shows the money, writes a shared receipt, and settles it — inside limits you set.

---

## What's real vs what's deferred (read before judging)

| Surface | Status | Evidence |
|---|---|---|
| Unpaid research → **HTTP 402** | **Live** | `/demo` beat 2 · production API |
| Prepaid debit → Tavily + TinyFish → receipt | **Live** | `/demo` beat 3 · providers in response |
| Quote preview (price / balance / cap, no debit) | **Live** | `GET /api/v1/research/quote` |
| Shared invoice + demo mark-paid | **Live** | `/demo` beat 4 · `/api/v1/demo/invoice/pay` |
| **402 INSUFFICIENT_BALANCE** when empty | **Live** | `/demo` beat 5 · drain then prepaid call |
| Workspace **$20/UTC-day** cap | **Live** | `GET /api/v1/limits` · blocks with 429 |
| Flovia ledger dashboard | **Live** | `/dashboard` over real ledger rows |
| Browser Connect wallet (EIP-1193) | **Live (UI identity)** | MetaMask/Rabby/Coinbase · does **not** replace operator key |
| Public `/demo` session (seed → vault) | **Live** | No mainnet deposit required for contest path |
| Open x402 Base facilitator | **Configured when pay-to set** | Optional rail beside prepaid |
| Binance B402 merchant RSA settle | **Deferred** | Partner form blocked — documented, not faked |
| Multi-region durable ledger | **Not claimed** | Vercel `/tmp` is demo-durable per instance |
| “Unhackable” | **Never claimed** | Residual risk in [`memory/FACT_CHECK.md`](./memory/FACT_CHECK.md) |

Timed voiceover for the contest video: [`SUBMIT.md`](./SUBMIT.md).

---

## Why this wins Track A

Peers will ship chat wrappers and “I traded once” MCP demos.

**METER deletion test:** wipe the ledger → agents can still pay elsewhere, but **shared usage + invoice + receipt truth disappears**. That is the product.

| Judging lens | METER |
|---|---|
| Agent OS pay story | Live **HTTP 402** + prepaid debit before providers run |
| Shared truth | One ledger → receipts + invoices both sides can read |
| Limits | Workspace **$20/UTC-day** cap (x402 product law) |
| Honesty | B402 merchant form deferred — prepaid + open facilitator primary |

Contest kit (video script + X quote): [`SUBMIT.md`](./SUBMIT.md)

---

## Live product (no mocks)

<p align="center">
  <a href="https://youtu.be/eqBMozL5CgU">
    <img src="https://img.youtube.com/vi/eqBMozL5CgU/maxresdefault.jpg" alt="METER contest demo video — six beats live 402 → prepaid → receipt → insufficient balance" width="100%" />
  </a>
</p>

<p align="center"><em><a href="https://youtu.be/eqBMozL5CgU">Demo video</a> — Fund → 402 → quote+prepaid settle → invoice+pay → insufficient-balance 402 → $20/day cap</em></p>

<p align="center">
  <img src="./public/demo-screenshot.png" alt="METER live demo — five beats against real /api/v1" width="100%" />
</p>

<p align="center"><em>/demo — interactive six-beat flow against real /api/v1</em></p>

<p align="center">
  <img src="./public/dashboard-screenshot.png" alt="METER dashboard overview — live Flovia ledger" width="100%" />
</p>

<p align="center"><em>/dashboard — shared Flovia ledger, workspace filter, settlement status live</em></p>

---

## Architecture

<p align="center">
  <img src="./public/architecture-meter.svg" alt="METER architecture: fund → 402 → settle → receipt → invoice → cap" width="100%" />
</p>

```mermaid
flowchart LR
  A[Client / Agent] --> B[src/server.ts]
  B --> C["/api/v1/*"]
  C --> D[paystream]
  C --> E[research]
  C --> F[invoice]
  C --> G[ledger / flovia]
  E -->|402 or prepaid| H[Tavily + TinyFish]
  D --> G
  E --> G
  F --> G
```

```
Client / Agent
  → src/server.ts
    → src/meter/http.ts   (/api/v1/*)
      → paystream / research / invoice / flovia / ledger
    → TanStack Start (marketing + dashboard)
```

---

## Core capabilities

### 1. Live metered research (402 → prepaid)
Unpaid calls get a real **402 Payment Required**. Prepaid calls debit the agent subaccount **before** Tavily + TinyFish run; provider failure **refunds** the debit.

### 2. Shared receipts & agent↔agent invoices
Every settled call writes a receipt. Invoices roll unbilled receipts into one A2A object both sides can see.

### 3. Flovia ledger + daily cap
Dashboard + `GET /api/v1/ledger` show live volume, fees, agents, and limit utilization. Cap trips cleanly (429), not as a silent overspend.

### 4. Operator vault & multi-workspace UI
Browser vault stores operator key + agent tokens. Workspaces filter the shared ledger client-side (multi-tenant lite).

---

## Binance Agent OS surface map

| Pillar | METER surface | Status |
|---|---|---|
| **Pay / x402** | `GET /api/v1/research` → 402 or prepaid / optional Base mainnet facilitator | **Live** (prepaid primary) |
| **MCP / skills** | `GET /api/v1/mcp/skills` + OpenAPI | **Live** catalog |
| **Control / limits** | Operator key · agent tokens · `$20/day` workspace cap | **Live** |
| **Agentic wallet / B402 merchant** | Partner RSA `/papi/v2/b402/*` | **Deferred** (form blocked — documented, not faked) |

---

## Live API

| Method | Path | Job |
|---|---|---|
| GET | `/api/v1/health` | Provider + settle-rail wiring |
| GET | `/api/v1/health?deep=1` | Live network probes |
| POST | `/api/v1/subaccounts` | Fund agent (returns `agentToken` once) |
| GET/POST | `/api/v1/research?q=` | Paid research |
| POST | `/api/v1/invoices` | Issue from unbilled receipts |
| POST | `/api/v1/invoices/:id/pay` | Mark paid |
| GET | `/api/v1/ledger` | Flovia overview |
| GET | `/api/v1/limits` | Cap utilization |
| GET | `/api/v1/openapi.json` | Machine-readable surface |
| GET | `/api/v1/mcp/skills` | Skill catalog |
| POST | `/api/v1/demo/seed` | Public demo fund |
| POST | `/api/v1/demo/invoice` | Public demo invoice |
| POST | `/api/v1/demo/invoice/pay` | Mark demo invoice paid |
| POST | `/api/v1/demo/drain` | Zero demo balance (for insufficient-balance proof) |
| GET | `/api/v1/research/quote` | OKX-style price/balance/cap preview (no debit) |
| POST | `/api/v1/waitlist` | Access waitlist |

Prepaid headers: `X-Meter-Agent-Id`, `X-Meter-Agent-Token`, `X-Meter-Payment: prepaid`.

---

## Settle rails

| Rail | Status | Needs |
|---|---|---|
| Prepaid ledger | **Live** | Fund subaccount + agent token |
| Open x402 · Base mainnet (`facilitator.payai.network`) | Optional / configured when pay-to set | `METER_PAY_TO` + USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Binance B402 merchant | Deferred | Partner form / RSA onboarding |

Details: [`memory/SETTLE_RAILS.md`](./memory/SETTLE_RAILS.md)

---

## Quickstart

```sh
cp .env.example .env   # TAVILY_API_KEY, TINYFISH_API_KEY, METER_OPERATOR_KEY, optional AGENT_ROUTER_*
npm i
npm run dev
npm run smoke          # health → waitlist → fund → 402 → paid research → invoice → ledger → stress×5
```

Try production without installing: https://meter-sooty.vercel.app/demo

---

## What we can still add

### Owner (contest bottleneck — today)

1. ~~**60–120s demo video**~~ → https://youtu.be/eqBMozL5CgU (**done**)
2. Follow @Binance · **repost** official post · **quote** with video + GitHub + production URL
3. Hackathon **survey** + jurisdiction check
4. **Rotate** the Vercel token that was pasted in chat

### Packaging (high leverage, no UI rewrite)

| Add | Why | Status |
|---|---|---|
| Netro-style README hero + badges + architecture SVG | Judges land on GitHub first | **Done** |
| Honest “what's real vs deferred” table | Afterimage-style packaging discipline | **Done** |
| Timed voiceover script in SUBMIT.md | Judges hear the deletion test + live 402 path | **Done** |
| Live `/demo` + `/dashboard` screenshots in README | Proof without clicking | **Done** |
| OG image + meta (`og-meter.png`) for X/Discord unfurl | Link previews look finished | **Done** |
| Contest **demo video** on YouTube | Motion packaging for judges / X quote | **Done** — https://youtu.be/eqBMozL5CgU |

### Product (post-submit)

- Server-side workspace partition (beyond client-side filter)
- Durable ledger beyond Vercel `/tmp` (demo-durable per instance today)
- B402 RSA client when merchant credentials exist
- Optional Venice LLM only if you want synthesis beyond AgentRouter

---

## Doctrine

No mocks. No silent fallbacks. Not “unhackable” — residual risk (serverless ledger path, deferred B402, WAF egress for some LLM hosts) is documented in [`memory/FACT_CHECK.md`](./memory/FACT_CHECK.md).
