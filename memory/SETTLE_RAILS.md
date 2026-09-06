# METER settle rails (no fake Binance B402)

Binance partner Google Form is **blocked** for the owner. Official docs expose **no** alternate public apply email. Tollgate (peer Track A) has the same gap.

## Rails (priority order)

### 1) Prepaid — LIVE (demo primary)
- Headers: `X-Meter-Agent-Id` + `X-Meter-Payment: prepaid`
- Durable ledger + receipts + invoices
- No Google Form, no gas, no facilitator key

### 2) Open x402 facilitator — optional on-chain
- Default URL: `https://x402.org/facilitator` (probed: `/supported` returns kinds including Base Sepolia `eip155:84532`)
- Requires owner:
  - `METER_PAY_TO=0x…` receive address
  - `METER_USDC_ASSET=` testnet USDC (Base Sepolia default in `.env.example`)
  - `METER_SETTLE_NETWORK=base-sepolia` (or CAIP `eip155:84532` if client expects it)
- Uses public verify/settle — **no** Binance `clientId`
- Residual risk: third-party facilitator custody/ops; testnet only for demo

### 3) Binance B402 merchant — blocked until onboarding
- Needs RSA + form/support → `clientId` / `accessToken` / base URL
- RSA keypair already generated under gitignored `meter-b402-keys/`
- Support ticket template: `memory/research-raw/b402-apply/SUPPORT_TICKET_TEMPLATE.md`
- Until then: `binanceAgentOs.configured=false` — fail closed, never invent txHash

## Explicitly rejected
- Claiming “Binance settle” without credentials
- `unpaidDemo` theater as if paid (we prepaid instead)
- Self-hosting an unaudited facilitator as “production Binance B402”

## Health
`GET /api/v1/health?deep=1` reports `settleRails[]` + probes open facilitator `/supported`.
