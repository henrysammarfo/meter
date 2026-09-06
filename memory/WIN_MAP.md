# METER — Win Map (Agent OS Mini Hackathon)

**Updated:** 2026-09-05  
**Primary track:** A (build an agent with Agent OS)  
**Deadline:** 2026-09-08 23:59 UTC

## Prize reality

| Track | Pool | How money is split | METER posture |
|---|---|---|---|
| A | $20,000 USDC | 1st $2k · 2nd $1.5k · 3rd $1k · next 50 × $300 | **Primary** — aim podium or paid placement |
| B | $40,000 USDC | First 10k eligible MCP+trade × $4 | **Parallel opportunistic** — connect MCP + one approved trade if eligible; not the product thesis |

## Judges see (Track A)

Peers will ship: chat wrappers, “I traded once” MCP demos, orphan x402 hello-world.

**METER deletion test:** remove our ledger → agents can still pay, but nobody has shared usage + invoice + receipt truth.

## Agent OS surfaces we must show

1. **MCP** — connected agent (market read and/or controlled action in Agentic sub-account).  
2. **x402 / Pay** — paid `/research` (or skill) with real 402 → verify → settle path.  
3. **Skills Hub** — register METER as a paid skill / bazaar-visible resource when B402 live.  
4. **Limits** — respect ~$20/day x402 product law; show batching / session tabs.  
5. **Control** — operator key, subaccount isolation story, revoke/permissions language from Agent OS.

## Submission checklist (owner)

- [ ] Follow @Binance + repost official Mini Hackathon post  
- [ ] Quote/reply with **demo video** + **GitHub**  
- [ ] Complete **survey**  
- [ ] Confirm jurisdiction (not US/UK/EEA/HK/SG / prohibited)  
- [ ] Optional: Track B MCP connect + trade for $4 if eligible  

## Build order (no calendar estimates — technical)

1. Owner: Agent OS hub OK + MCP OAuth connected.  
2. Owner: B402 Sandbox merchant path unblocked (form or support).  
3. Code: rewrite Binance client to RSA + `/papi/v2/b402/*`; wire pay-to.  
4. Demo: fund → 402 → paid live research → invoice → shared receipt → daily cap.  
5. Package: README deletion-test + video + X + survey.

## Residual risk (honest)

Not unhackable. File ledger single-host; WAF on some egress; B402 base URL gated; keys pasted in chat must rotate.


## Progress 2026-09-06 09:17 UTC
- [x] Agent OS / MCP connected (VS Code)
- [ ] Agentic sub confirmed (Step 1d)
- [ ] B402 merchant credentials (settle)
- [ ] Demo video + X + survey
