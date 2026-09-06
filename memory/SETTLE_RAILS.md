# METER settle rails

Binance partner Google Form is **blocked** for the owner. Official docs expose **no** alternate public apply email.

## Rails (priority)

### 1) Prepaid — LIVE (demo always-on)
- Headers: `X-Meter-Agent-Id` + `X-Meter-Payment: prepaid`
- Durable ledger + receipts + invoices

### 2) Open x402 on **Base mainnet** — optional on-chain
- Facilitator: `https://facilitator.payai.network` (**VERIFIED** lists `eip155:8453` / `base`)
- Network default: `eip155:8453` (Base **mainnet**, not Sepolia)
- USDC (Circle on Base): `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Needs owner `METER_PAY_TO=0x…` (Base mainnet receive wallet)
- Residual risk: third-party facilitator ops; real mainnet funds — start with tiny amounts

**Not used as default:** `https://x402.org/facilitator` — probed **testnet-only** (no `eip155:8453`).

### 3) Binance B402 on BSC mainnet — blocked until onboarding
- Production chain per Binance docs: BSC `eip155:56`
- RSA ready under gitignored `meter-b402-keys/`
- Upgrade path when Support/form works — never fake tx hashes

## Health
`GET /api/v1/health?deep=1` → `settleRails[]` + open facilitator `/supported` probe.
