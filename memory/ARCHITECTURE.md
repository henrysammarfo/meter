# METER — Architecture

## One sentence

Agent calls paid skill → pay (prepaid subaccount or x402) → receipt on shared ledger → invoice → Flovia.

## Request path

```
Client / Agent
  → src/server.ts fetch
    → src/meter/http.ts   (/api/v1/*)
      → paystream / research / invoice / flovia / ledger
    → TanStack Start SSR (pages)
```

## Modules

| Module | Code | Persist |
|---|---|---|
| PAYSTREAM | `paystream.ts`, `research.ts`, `x402.ts` | receipts + balances |
| INVOICE | `invoice.ts` | invoices + receipt.invoiceId |
| FLOVIA | `flovia.ts` | derived read model |
| Providers | `clients/tavily.ts`, `tinyfish.ts`, `llm.ts` | none |

## Payment modes

1. **Prepaid (live now):** Fund `POST /api/v1/subaccounts` → call with `X-Meter-Agent-Id` + `X-Meter-Payment: prepaid`.
2. **x402 on-chain (gated):** `PAYMENT-SIGNATURE` → facilitator verify/settle when `METER_PAY_TO` + `METER_USDC_ASSET` (+ optional Binance facilitator URL).

## Deletion test

Delete `data/ledger.json` (or wipe store) → dashboard empty, invoices gone, no shared receipts. Payments may still exist elsewhere, but METER’s shared truth is gone.

## Env contracts

See `.env.example`. Fail closed via `requireSecret` / `MeterLiveError`.
