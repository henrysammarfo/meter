---
name: meter-architecture
description: Builds and extends METER Track A (paystream, invoice, flovia, x402, Binance Agent OS). Use when implementing metering, receipts, invoices, dashboard ledger wiring, or contest demo flows.
---

# METER Architecture Skill

## When to use

Implementing or changing PAYSTREAM, INVOICE, FLOVIA, x402 challenges, Agent OS demo beats, or live provider clients.

## Instructions

1. Read `memory/METER_BIBLE.md` and `memory/CURRENT_STATE.md` before coding.
2. Declare filepath, purpose, dependencies, consumers (architecture contract).
3. Wire through `src/meter/http.ts` — do not add parallel mock APIs.
4. Persist every paid call as a receipt; invoices only from unbilled receipts.
5. Fact-check contest/platform claims into `memory/FACT_CHECK.md` with source URLs.
6. Run `node --env-file=.env scripts/smoke-meter.mjs` after API changes.
7. Update memory SESSION_LOG + CURRENT_STATE on material changes.

## Modules

| Module | Path | Job |
|---|---|---|
| PAYSTREAM | `src/meter/paystream.ts` + `research.ts` | Meter + settle |
| INVOICE | `src/meter/invoice.ts` | A2A bills |
| FLOVIA | `src/meter/flovia.ts` | Analytics |

## Anti-patterns

- Static demo arrays presented as live data
- Catch-all empty responses that hide provider failure
- Claiming Binance on-chain settle without `BINANCE_*` / `METER_PAY_TO` credentials
