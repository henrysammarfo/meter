# METER — Contest Submit Kit (Track A)

**Production:** https://meter-sooty.vercel.app  
**GitHub:** https://github.com/henrysammarfo/meter  
**Deadline:** 2026-09-08 23:59 UTC  

## Live proof (already green on production)

| Check | Result |
|---|---|
| `GET /api/v1/health` | `ok: true` · Tavily + TinyFish configured · prepaid rail live |
| `POST /api/v1/demo/seed` | funds `agent_demo_7c1` + one-time `agentToken` |
| unpaid `GET /api/v1/research` | **402** Payment Required |
| prepaid research | **200** · providers `tavily` + `tinyfish-search` + `tinyfish-fetch` · receipt id |
| `POST /api/v1/demo/invoice` | **201** open invoice from unbilled receipts |
| `GET /api/v1/ledger` | shared agents / receipts / invoices |

Deletion test: remove the METER ledger → agents can still pay elsewhere, but shared usage + invoice + receipt truth disappears.

## Owner submit checklist (you must do these)

1. [ ] **Demo video** (60–120s) following the beat script below  
2. [ ] Follow [@Binance](https://x.com/Binance)  
3. [ ] **Repost** the official Agent OS Mini Hackathon post  
4. [ ] **Quote/reply** with video + this GitHub URL + production URL  
5. [ ] Complete the hackathon **survey**  
6. [ ] Confirm jurisdiction (not US/UK/EEA/HK/SG / prohibited)  
7. [ ] **Rotate** the Vercel token pasted in chat (1-day token — revoke now that env is set)

Optional Track B: one MCP trade if eligible for the $4 — not the product thesis.

## Demo video script (say this while clicking)

1. Open https://meter-sooty.vercel.app — “METER meters agent↔agent API spend with shared receipts.”  
2. Open **/demo** → Start live flow  
   - Beat 1 Fund → Beat 2 **402** → Beat 3 prepaid settle (live Tavily+TinyFish) → Beat 4 invoice → Beat 5 daily cap  
3. Open **/dashboard** — show receipt + invoice on the shared ledger; switch workspace if useful  
4. Close: “Prepaid primary. B402 merchant deferred honestly. No mocks.”

## Suggested X quote text

```
METER — Track A for Binance Agent OS

Agent↔agent metered APIs with live 402 → prepaid settle → shared receipt/invoice.
Demo: https://meter-sooty.vercel.app/demo
GitHub: https://github.com/henrysammarfo/meter

No mocks. Prepaid live. B402 merchant path deferred until partner form opens.
```

## What ships / what doesn’t (honest)

- **Ships:** prepaid subaccounts, agent tokens, atomic debit/refund, live research, invoices, ledger, waitlist, multi-workspace UI filter, public demo  
- **Deferred:** Binance B402 merchant RSA settle (form blocked) — open facilitator / prepaid remain primary  
- **Residual risk:** serverless ledger path is `/tmp` (demo-durable per instance, not multi-region HA). Not unhackable.
