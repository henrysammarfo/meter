# Track A landscape (fetched 2026-09-06)

## Prize / deadline (reconfirmed)

- Pool $60k USDC; Track A $20k (tiers $2k/$1.5k/$1k + 50×$300); Track B $40k ($4×10k)
- Deadline 2026-09-08 23:59 UTC
- Source: Binance blog + Square; secondary press

## What peers are shipping (GitHub search)

Dominant pattern: **trading / risk-guardian copilots** on MCP (confirm-before-trade).

| Repo | Angle |
|---|---|
| xinyuzjj/bazz.agent | Full Agent OS cockpit: MCP + Agentic Wallet + x402 + Skill Hub |
| thisishaidee/tollgate | **Closest to METER** — “pay for evidence”, HTTP 402, honest: **no B402 partner keys**, `UNPAID_DEMO`, never invents txHash |
| PugarHuda/jaga-agent, hackid02/agent-skeptic, etc. | Risk governors / safe-trade |
| Many others | Leaderboard bots, portfolio bodyguards, bStocks helpers |

## Implication for METER

- Peers already admit Binance B402 merchant form is a bottleneck (Tollgate docs).
- Differentiator is **not** “we also chat-trade”. Differentiator = **durable shared ledger + invoices + dual-agent receipts + live paid research**, with prepaid as a real settle rail (not unpaidDemo theater).
- Do **not** claim Binance B402 merchant settle until credentials exist.

## Settle options without Google Form

| Option | Verdict |
|---|---|
| Wait on Google Form / Live Chat | Keep trying; not blocking demo |
| Self-build facilitator | Possible but needs gas wallet, security review, residual risk — **not** contest primary |
| Open x402.org facilitator | **VERIFIED** `/supported` live (Base Sepolia `eip155:84532` + others) — needs `METER_PAY_TO` + USDC asset |
| Vistara `facilitator.b402.ai` | Documented open BSC facilitator; **unreachable from this egress** (probe 000) — optional later |
| Coinbase CDP facilitator | Needs CDP project; not probed green here |
| **Prepaid METER ledger** | **Already live** — primary demo settle |

## Chosen doctrine

1. Demo win path = **MCP (done) + prepaid settle (done) + live research (done) + invoices/receipts**
2. Optional on-chain = open `https://x402.org/facilitator` when owner sets pay-to
3. Binance B402 merchant = upgrade when support/form works — never fake tx hashes
