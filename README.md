# METER

Agent↔agent pay + API metering + shared receipts for **Binance Agent OS Track A**.

> Soft pitch: When AIs pay each other or charge for an API call, METER shows the money, the receipt, and settles it — inside limits you set.

**Production:** https://meter-sooty.vercel.app · **Demo:** https://meter-sooty.vercel.app/demo  
**Contest submit kit:** [`SUBMIT.md`](./SUBMIT.md)

## Live surface

| Method | Path | Job |
|---|---|---|
| GET | `/api/v1/health` | Provider wiring |
| POST | `/api/v1/subaccounts` | Fund sandbox agent (withdrawals restricted) |
| GET | `/api/v1/research?q=` | Paid research (402 or prepaid → Tavily + TinyFish) |
| POST | `/api/v1/invoices` | Issue invoice from unbilled receipts |
| GET | `/api/v1/ledger` | Flovia overview |

Prepaid headers: `X-Meter-Agent-Id`, `X-Meter-Agent-Token` (minted on fund), `X-Meter-Payment: prepaid`.

## Setup

```sh
cp .env.example .env   # add TAVILY_API_KEY, TINYFISH_API_KEY, optional AGENTROUTER_*
npm i
npm run dev
npm run smoke          # live health → 402 → paid research → invoice → stress×5
```

Architecture + fact-check: `memory/ARCHITECTURE.md`, `memory/FACT_CHECK.md`.

## Settle rails

| Rail | Status | Needs |
|---|---|---|
| Prepaid ledger | **Live** | Operator fund subaccount |
| Open x402 on **Base mainnet** (`facilitator.payai.network`) | Optional | `METER_PAY_TO` + Base USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |

Defaults: `METER_SETTLE_NETWORK=eip155:8453` (Base **mainnet**, not Sepolia). Details: `memory/SETTLE_RAILS.md`.

## Doctrine

No mocks. No silent fallbacks. Not “unhackable” — residual risk documented in memory.

Built with [Lovable](https://lovable.dev). Continue in the [Lovable editor](https://lovable.dev/projects/31455f2e-fb0d-456f-b67f-cf904f224cc3).
