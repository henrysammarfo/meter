# METER — Recommendations (raise Track A win chance)

Prioritized by impact before **2026-09-08 23:59 UTC**. See also `memory/WIN_MAP.md`.

## P0 — Contest artifacts

1. **Record the five-beat live demo** (fund → 402 → paid research → invoice → limits) against production `/api/v1`.  
2. **GitHub README** with architecture diagram + deletion test.  
3. **X quote + survey** exactly per Binance rules (geo-check first).  
4. Open **https://www.binance.com/en/agent-os** and connect **MCP** (`https://agent.binance.com/mcp/agentic`) so the demo is visibly Agent OS.

## P0 — Settlement wow

5. Supply **B402 / x402 merchant** credentials (Sandbox→Production) → flip on-chain settle; keep prepaid as sandbox mirror.  
6. Show **batching under $20/day** in UI copy and a limit-trip in the video.  
7. Rewrite `src/meter/clients/binance.ts` to official RSA + `X-Tesla-*` + `/papi/v2/b402/*` (docs-verified gap).

## P1 — Providers

8. **Rotate all keys** pasted in chat.  
9. Fund TinyFish Agent wallet **or** stay on Search/Fetch (already enough for research).  
10. Unblock LLM: Venice key **or** AgentRouter from non-WAF egress — optional for synthesis, not required for settle demo.

## P1 — Product sharpness vs peers

11. One screen that proves **both agents see the same receipt id**.  
12. Public rate card only for `/research` live; keep other endpoints paused until real handlers exist (no fake live badges).  
13. Optional Track B: one MCP trade if eligible ($4) — do not turn METER into a trading bot.

## P2 — Hardening (honest, not “unhackable”)

14. Move ledger to managed store (D1/Postgres) before multi-instance deploy.  
15. Add request auth for operator APIs (fund/invoice) separate from agent pay headers.  
16. Threat model doc: key theft, facilitator malice, prompt injection, ledger tampering.

## Bible adjustments

- Prefer TechCrunch-verified **$20/day x402** language over vague “batch somehow”.  
- Prefer **BSC (56/97)** for B402 settle language once credentials exist — not Base Sepolia as Binance Production.  
- Keep BRAKE/trading on the kill list for Track A narrative.
