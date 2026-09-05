# METER — Extreme Win Bible (Binance Agent OS Track A)

> **Doctrine:** Win Track A ($20k) as company demo, not trophy bot. Residencies parked.  
> **Track:** **A** — agent workflows: **data · payment · onchain** (not Track B trading)  
> **Deadline:** **Sep 8, 2026 23:59 UTC** · X quote + survey  
> **Sources:** [`SUPER_IDEAS.md`](memory/research-raw/hackathons/SUPER_IDEAS.md) · [`MARKET_VALIDATION.md`](memory/research-raw/hackathons/MARKET_VALIDATION.md) · Binance Agent OS / x402 docs  
> **Supersedes:** BRAKE (Track B) as primary.

---

## 0. Mission

Make **agent↔agent pay + API metering + shared receipts** load-bearing on Binance Agent OS. Delete METER → payments exist but nobody has one ledger.

---

## 1. One sentence

**Soft:** When AIs pay each other or charge for an API call, METER shows the money, the receipt, and settles it automatically — inside limits you set.

**8-second:** Agent calls paid skill → x402 settle → invoice to client agent → both see receipts on METER.

---

## 2. Contest laws

| Item | Value |
|---|---|
| Total pool | **$60,000 USDC** (Mini Hackathon) |
| Track A prize | **$20,000 USDC** pool — tiers: $2,000 / $1,500 / $1,000 / next 50 × $300 (owner paste) |
| Track B | Optional: first 10k MCP+trade × $4 from $40k — not product thesis |
| Hub | https://www.binance.com/en/agent-os |
| Submit | Follow @Binance · repost · quote/reply (demo + GitHub) · survey |
| Ghana | Likely OK · US/UK/EEA/HK/SG blocked |
| Constraint | x402 ~**$20/day** default — batch / session tabs |
| MCP | `https://agent.binance.com/mcp/agentic` (OAuth; Agentic sub; no withdraw) |

---

## 3. Wow angle

Peers: chat wrappers · “I traded once” MCP demos · orphan x402 hello-world.

**METER wow:** Flovia + invoice + paystream in one product — Stripe can’t clear **$0.02** agent calls; METER can.

---

## 4. Architecture

```
API Seller / Agent A
  → Meter middleware (units × price)
  → x402 challenge / settle (Agentic Wallet)
  → Invoice to Agent B (client)
  → METER ledger UI (usage · pays · fails · limits)
Binance Agent OS: MCP data (read) · x402 · subaccount sandbox
```

| Module | Job |
|---|---|
| **PAYSTREAM** | Metered endpoints |
| **INVOICE** | A2A bill + pay |
| **FLOVIA** | Dashboard analytics |

---

## 5. Business

- Who: API sellers, agent operators, freelancers on Agent OS  
- $: **1–2%** settle take + **$49–199/mo** seats  
- Beachhead ESTIMATE: $5M settle/yr × 1.5% ≈ **$75k ARR**  

---

## 6. Demo beat

1. Fund agent subaccount (withdrawals restricted — show sandbox)  
2. Client agent hits paid `/research` → 402 → pay  
3. Invoice appears · both receipts  
4. Hit daily limit → graceful fail + audit  
5. Dashboard totals  

---

## 7. SDK exceed

- [ ] Real x402 settle (not mock)  
- [ ] Batching under $20/day cap documented  
- [ ] Deletion: remove ledger → demo has no shared truth  
- [ ] No Track B required  

---

## 8. Kill list

- BRAKE / trading bot · TAKEN port · read-only portfolio essay  

---

## 9. Build (≤ Sep 8)

Day 1–2: Agent OS connect + x402 path  
Day 3–4: Invoice + dashboard  
Day 5: Video + GitHub + X + survey  

---

## 10. Pitch (15s)

Agents already pay in micropayments Stripe can’t clear. METER is the ledger and settlement layer on Binance Agent OS — usage, invoices, and receipts in one place.
