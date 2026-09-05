# METER — Fact Check

Rules: every claim is **VERIFIED**, **PARTIAL**, **DISPUTED**, **UNKNOWN**, or **INTERNAL**. Sources linked. No vibes.

## Contest & Agent OS

| Claim | Status | Evidence |
|---|---|---|
| Track A prize $20,000 USDC | **VERIFIED** | Binance X announcement via Tavily; Blockchain.News; HackList |
| Total pool $60k USDC; Track B $40k | **VERIFIED** | Same cluster; deadline Sep 8, 2026 23:59 UTC |
| Submit: follow @Binance, repost, demo/GitHub, survey | **VERIFIED** | HackList; Blockchain.News flash |
| US/UK/EEA/HK/SG blocked | **VERIFIED** | HackList listing |
| Ghana OK | **UNKNOWN** | Bible says “Likely OK” — no primary counsel doc fetched; treat as jurisdiction check for owner |
| Agent OS includes APIs, Agentic Hub, x402, Skill Hub, MCP | **VERIFIED** | TechCrunch 2026-08-20; TinyFish Search hits on Binance Academy/Blog |
| Subaccount withdrawals blocked by default | **VERIFIED** | TechCrunch interview with Jeff Li |
| x402 payments limited to **$20/day** | **VERIFIED** | TechCrunch: “x402 payments are limited to $20 a day, according to the company.” |
| Swaps $50k/day · DeFi $100k/day defaults | **VERIFIED** | Same TechCrunch article |
| Bible “BNB Smart Chain” as settle chain for METER demo | **PARTIAL / REVISED** | Prior UI assumed BSC; live stack uses prepaid sandbox + optional Base Sepolia facilitator until Binance credentials exist |
| Bible take 1–2% seats $49–199 · $75k ARR beachhead | **INTERNAL ESTIMATE** | Business guess — not independently verified |

## x402 protocol

| Claim | Status | Evidence |
|---|---|---|
| HTTP 402 + PAYMENT-REQUIRED / PAYMENT-SIGNATURE / PAYMENT-RESPONSE | **VERIFIED** | docs.x402.org + foundation specs |
| Facilitator verify/settle pattern | **VERIFIED** | docs.x402.org seller quickstart |
| Batch settlement exists in protocol | **VERIFIED** | docs.x402.org schemes (batch-settlement / upto) |
| Stripe cannot clear $0.02 agent calls | **PARTIAL** | Industry narrative; not a Stripe policy cite in our dumps |

## Keys & integrations (live probes 2026-09-04)

| Probe | Status | Evidence |
|---|---|---|
| Tavily search | **VERIFIED OK** | `memory/research-raw/live/tavily_*.json` |
| TinyFish Search | **VERIFIED OK** | `tinyfish_search_agentos.json` |
| TinyFish Fetch | **VERIFIED OK** | `tinyfish_fetch_*.json` |
| TinyFish Agent `/automation/run` | **VERIFIED FAIL** | HTTP 403 insufficient credits (0) |
| AgentRouter `/v1/models` & chat from this host | **VERIFIED FAIL** | Aliyun WAF HTML captcha |
| AgentRouter `co.agentrouter.org` with same key | **VERIFIED FAIL** | `Invalid API Key` |
| aftercut folder on Desktop | **MISSING** | Not present on this Cloud Agent VM |

## Security posture

| Claim | Status | Notes |
|---|---|---|
| “Unhackable” / nation-state proof | **REJECTED** | Owner clarified they are **not** claiming this. Residual risk remains. |
| Keys pasted in chat | **RISK** | Stored only in gitignored `.env`; **rotate after this session** |
| File ledger durability | **RISK** | Single-host JSON; not multi-region; Cloudflare Workers need different binding |

## Bible corrections / win recommendations

1. Keep Track A focus — peers ship chat wrappers; METER’s deletion-test ledger is the differentiator.  
2. Treat **$20/day** as hard product law; show batching / session tabs in pitch.  
3. Do not claim BSC settle until Binance/on-chain credentials are live.  
4. Prefer live prepaid + live research in the demo video (already wired).  
5. Upload stage Bible + Binance keys ASAP — settle path is the contest wow.

## 2026-09-05 — Live smoke (this host)

Verified via `npm run smoke` (exit 0):
- Deep health probes: Tavily + TinyFish reachable
- Waitlist durable write
- OpenAPI + MCP skills catalog non-empty
- Subaccount fund
- Unpaid research → HTTP 402 + PAYMENT-REQUIRED
- Paid research → live sources + TinyFish fetched pages + receipt (`tinyfish-fetch` in providers)
- Invoice issuance from unbilled receipts
- Ledger `calls24h` ≥ 1
- Stress: 5 parallel paid research calls all 200

Still unverified until keys arrive: Binance Agent OS settle, on-chain x402, Venice/AgentRouter LLM synthesis.

## 2026-09-05 — AgentRouter AFTERCUT wiring (verified live)

| Claim | Result | Evidence |
|---|---|---|
| AFTERCUT base `https://agentrouter.org` + Claude Code wire headers | **Implemented** | `src/meter/clients/agent-router.ts` (`getAgentRouterKey`, `claudeCodeHeaders`, `liveChat`) |
| PONG smoke from this cloud egress | **FAIL** `{ok:false, status:403}` | HTTP 200 text/html Aliyun WAF captcha despite AFTERCUT headers (curl + node) |
| Remap to `co.agentrouter.org` as WAF “fix” | **REJECTED (doctrine)** | Owner AFTERCUT rule: stay on `agentrouter.org`; WAF fix = wire headers, not co host |
| Same key on `co.agentrouter.org` | **401 Invalid API Key** | Real JSON API (no WAF) but key rejected — rotate in console; never paste in chat |
| Native Anthropic/OpenAI keys | **Forbidden** | AgentRouter is the only gateway |

Prior “fix” that remapped to `co.agentrouter.org` was reverted. Fail closed; no mocks.
