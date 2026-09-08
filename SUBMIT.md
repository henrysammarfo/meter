# METER — Contest Submit Kit (Track A)

**Production:** https://meter-sooty.vercel.app  
**Demo:** https://meter-sooty.vercel.app/demo  
**Demo video:** https://youtu.be/eqBMozL5CgU  
**GitHub:** https://github.com/henrysammarfo/meter  
**Deadline:** 2026-09-08 23:59 UTC  

## Live proof (already green on production)

| Check | Result |
|---|---|
| `GET /api/v1/health` | `ok: true` · Tavily + TinyFish configured · prepaid rail live |
| `POST /api/v1/demo/seed` | funds `agent_demo_7c1` + one-time `agentToken` |
| unpaid `GET /api/v1/research` | **402** Payment Required |
| `GET /api/v1/research/quote` | preview price / balance / cap (no debit) |
| prepaid research | **200** · providers `tavily` + `tinyfish-search` + `tinyfish-fetch` · receipt id |
| `POST /api/v1/demo/invoice` + `/demo/invoice/pay` | invoice issued + marked paid |
| `POST /api/v1/demo/drain` then prepaid research | **402** `INSUFFICIENT_BALANCE` |
| `GET /api/v1/ledger` | shared agents / receipts / invoices |

Deletion test: remove the METER ledger → agents can still pay elsewhere, but shared usage + invoice + receipt truth disappears.

## What's real vs deferred (one-glance)

| Claim | Status |
|---|---|
| Live 402 / prepaid / receipt / invoice / insufficient-balance | **Real on production** |
| Timed VO + six-beat `/demo` | **Recorded** — https://youtu.be/eqBMozL5CgU · script below |
| Connect wallet (browser EIP-1193) | **UI identity** — MetaMask etc.; demo session works without it |
| Mainnet BNB deposit for contest video | **Not required** for prepaid demo path |
| Binance B402 merchant settle | **Deferred** (form blocked) — not faked |
| Unhackable | **Never claimed** |

## Owner submit checklist (you must do these)

1. [x] **Demo video** — https://youtu.be/eqBMozL5CgU  
2. [ ] Follow [@Binance](https://x.com/Binance)  
3. [ ] **Repost** the official Agent OS Mini Hackathon post  
4. [ ] **Quote/reply** with video + this GitHub URL + production URL  
5. [ ] Complete the hackathon **survey**  
6. [ ] Confirm jurisdiction (not US/UK/EEA/HK/SG / prohibited)  
7. [ ] **Rotate** the Vercel token pasted in chat (1-day token — revoke now that env is set)

Optional Track B: one MCP trade if eligible for the $4 — not the product thesis.

---

## FULL DEMO VIDEO SCRIPT (word for word)

**Target length:** 90–120 seconds  
**Screen:** start on https://meter-sooty.vercel.app then go to `/demo`, then `/dashboard`  
**Tone:** calm, clear, contest-judge friendly. Do not claim “unhackable.”  
**Before record:** hard-refresh https://meter-sooty.vercel.app · private window if the tab icon looks wrong · MetaMask optional (demo path does not need a wallet) · have `/demo` ready.

### [0:00–0:12] Open home

*(Land on https://meter-sooty.vercel.app — show the METER hero for 2–3 seconds.)*

> “This is **METER** — Track A for Binance Agent OS.
>
> When agents pay each other or charge for an API call, METER shows the money, writes a shared receipt, and settles it inside limits you set.”

*(Click **Live demo** / open https://meter-sooty.vercel.app/demo)*

### [0:12–0:22] Demo page intro

*(Show the six beats list on `/demo`.)*

> “This is the live demo. Every beat hits real `/api/v1` — not a fake animation.
>
> No mainnet deposit needed for this path. Prepaid ledger first. Honest gates.”

*(Click **Start live flow**)*

### [0:22–0:32] Beat 1 — Fund

*(Wait for the log: seed 201, balance, agentToken saved.)*

> “Beat one — fund.
>
> We seed the public demo agent with five USDC on the prepaid subaccount, mint an agent token once, and save the session in the browser vault.”

*(Click **Next beat**)*

### [0:32–0:42] Beat 2 — 402 challenge

*(Show HTTP 402 Payment Required in the log.)*

> “Beat two — unpaid research.
>
> Same endpoint, no payment header — the API returns a real **HTTP 402 Payment Required**, with a payment challenge. No free call.”

*(Click **Next beat**)*

### [0:42–0:58] Beat 3 — Quote + settle

*(Show quote line, then 200 OK with tavily + tinyfish providers and a receipt id.)*

> “Beat three — quote, then settle.
>
> First we call research quote — like a swap preview: price, balance, and cap room, with no debit yet.
>
> Then prepaid settle. The agent token debits before work runs. Live Tavily and TinyFish return sources. We get a shared receipt on the ledger.”

*(Click **Next beat**)*

### [0:58–1:10] Beat 4 — Invoice + mark paid

*(Show invoice id, then demo invoice pay → status paid.)*

> “Beat four — invoice.
>
> Unbilled receipts roll into an agent-to-agent invoice both sides can see.
>
> Then we mark it paid on the public demo path — shared invoice truth, not a private spreadsheet.”

*(Click **Next beat**)*

### [1:10–1:25] Beat 5 — Insufficient balance

*(Show drain → balance 0 → prepaid research → 402 INSUFFICIENT_BALANCE.)*

> “Beat five — the balance gate.
>
> We drain the demo balance to zero, then try the same prepaid call again.
>
> The API returns **402 Insufficient Balance**. That is the point — when there is no money, the call fails cleanly. When there is money, the same path settles.”

*(Click **Next beat**)*

### [1:25–1:35] Beat 6 — Daily cap

*(Show limits / $20 workspace cap line.)*

> “Beat six — limits.
>
> Workspace daily cap mirrors Binance x402 product law — twenty USDC per UTC day. Hit the cap and spend blocks with a clean limit response, not a silent overspend.”

### [1:35–1:55] Open ledger / close

*(Click **Open ledger** → briefly show Overview charts / receipts / invoices. Optional: Paystream Quote button.)*

> “Open the ledger — same receipts and invoices on the shared Flovia dashboard. Session restored from the demo vault.
>
> METER’s deletion test: wipe this ledger and agents can still pay elsewhere, but shared usage, invoices, and receipt truth disappear. That is the product.
>
> Prepaid primary. Real 402 and insufficient-balance gates. No mocks.
>
> Demo: meter-sooty.vercel.app/demo  
> GitHub: github.com/henrysammarfo/meter  
> METER — Binance Agent OS Track A.”

*(End on the dashboard or demo done state. Stop recording.)*

---

### Optional 15-second shorter cut (if you need under 60s)

> “METER — agent money ledger for Binance Agent OS Track A.  
> Live demo: fund, real 402, prepaid settle with Tavily and TinyFish, shared invoice, then insufficient-balance 402 when empty.  
> Shared receipts and a twenty-dollar daily cap. No mocks.  
> meter-sooty.vercel.app/demo · github.com/henrysammarfo/meter”

---

## Suggested X quote / reply text (paste with the video)

```
METER — Track A for Binance Agent OS

Agent↔agent metered APIs:
live 402 → quote → prepaid settle → shared receipt/invoice → insufficient-balance gate → $20/day cap.

Demo: https://meter-sooty.vercel.app/demo
Video: https://youtu.be/eqBMozL5CgU
GitHub: https://github.com/henrysammarfo/meter

No mocks. Prepaid live. B402 merchant path deferred until partner form opens.
```

## Recording tips

1. Speak a half-beat slower than normal; leave 0.5s after each **Next beat** so the log can paint.  
2. Zoom the demo log panel if the judge cannot read status codes.  
3. If a beat errors, hit **Reset**, hard-refresh, start again — do not narrate a failed run.  
4. Do **not** say “unhackable.” If asked: residual risk is documented; prepaid demo path is the honest contest proof.  
5. **Demo video is live:** https://youtu.be/eqBMozL5CgU — attach it in the Binance quote/reply + survey.

## What ships / what doesn’t (honest)

- **Ships:** prepaid subaccounts, agent tokens, atomic debit/refund, live research, invoices, ledger, waitlist, multi-workspace UI filter, public demo, quote preview, insufficient-balance gate  
- **Deferred:** Binance B402 merchant RSA settle (form blocked) — open facilitator / prepaid remain primary  
- **Residual risk:** serverless ledger path is `/tmp` (demo-durable per instance, not multi-region HA). Not unhackable.
