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

## 2026-09-05 — Binance OnChainPay / B402 credentials (docs verified)

| Claim | Status | Evidence |
|---|---|---|
| Partner apply form for B402 Open API | **VERIFIED** | https://forms.gle/aUQvxUETfGMzyTky5 linked from quick-start + `basics/6.apply-developer-account.md` |
| Sandbox vs Production = separate accounts/credentials | **VERIFIED** | Same apply doc: credentials not shared across envs |
| Apply materials: business name, email, EVM wallet, RSA public key, IP whitelist, optional webhook | **VERIFIED** | `6.apply-developer-account.md` |
| Issued: `clientId`, `accessToken`, webhook verify public key | **VERIFIED** | Same doc |
| Authenticated APIs: `/papi/v2/b402/{supported,verify,settle}` + RSA-SHA256 | **VERIFIED** | `basics/4.base-urls.md`, quick-start signed `/supported` example |
| Production chain for B402 authenticated APIs | **VERIFIED** | BSC Mainnet chain id **56** (`4.base-urls.md`) |
| Sandbox chain | **VERIFIED** | BSC Testnet chain id **97** |
| Authenticated base URLs public in docs | **FALSE / CONTACT** | Docs say “Please contact us for access” — URL handed with onboarding |
| Public Bazaar discovery (Production) | **VERIFIED** | `https://www.binance.com/bapi/ramp/v1/public/ramp/b402` |
| Default METER `METER_FACILITATOR_URL=https://x402.org/facilitator` = Binance Production | **FALSE** | x402.org facilitator is testnet-oriented (docs.x402.org); Binance Production needs onboarded B402 base URL |
| JS HTML pages on developers.binance.com from this host | **PARTIAL** | HTML WAF/JS gate; markdown under `/en/docs/.../*.md` fetchable |


## 2026-09-05 — B402 apply path + auth (deep read)

| Claim | Status | Evidence |
|---|---|---|
| Docs apply link `forms.gle/aUQvxUETfGMzyTky5` | **VERIFIED** | `basics/6.apply-developer-account.md` |
| Marketing "Apply for API Key" uses `forms.gle/xdkrQt1WTnQtK73R6` | **VERIFIED** | `page-7c60.*.js` `window.open(...)` |
| Both short links = same Google Form | **VERIFIED** | Both redirect to `1FAIpQLScUfaXvaKB4uE0smsl7HpOt4dqbDWLvmC5xthevQnyT7nBYqA` |
| Public non-Google apply email in docs | **FALSE / NOT FOUND** | Apply doc only links Google Form |
| Auth = Bearer token to `/verify` | **FALSE for B402 V2** | Headers are `X-Tesla-ClientId`, `X-Tesla-SignAccessToken`, `X-Tesla-Timestamp`, `X-Tesla-Signature` |
| Sign payload = `jsonBody + timestamp`, RSA-SHA256, 1024-bit | **VERIFIED** | `basics/3.request-signing.md` |
| Authenticated base URL public in docs | **FALSE** | "Please contact us for access" — handed at onboarding |
| Production chain BSC 56 / Sandbox BSC 97 | **VERIFIED** | `basics/4.base-urls.md` + payment methods |
| Bazaar production public base | **VERIFIED LIVE** | `https://www.binance.com/bapi/ramp/v1/public/ramp/b402` — 25 resources on 2026-09-05 |
| Owner cannot open Google Form | **OWNER REPORT** | Step 1 blocked; use long URL / support alternate |


## 2026-09-05 — Agent OS landing + Mini Hackathon (owner paste + cross-check)

| Claim | Status | Evidence |
|---|---|---|
| Hub URL `https://www.binance.com/en/agent-os` | **OWNER + PUBLIC** | Owner paste; binance.com WAF blocks headless fetch (HTTP 202 / JS challenge from this host) |
| Total prize **60,000 USDC** | **VERIFIED** | Owner paste; @Binance X via Tavily; blockchain.news flash + article 2026-09-04 |
| Track A pool **20,000 USDC** (build agent with Agent OS) | **VERIFIED** | Same cluster |
| Track A payout tiers: 1st $2,000 · 2nd $1,500 · 3rd $1,000 · next 50 × $300 | **OWNER-SUPPLIED** | Owner paste of official Mini Hackathon article; secondary press often only says “$20k track” without tiers — treat tiers as owner-verified from Binance article text |
| Track B pool **40,000 USDC** = first **10,000** eligible MCP+trade × **$4** | **OWNER-SUPPLIED + PARTIAL PRESS** | Owner paste; press confirms Track B $40k / MCP connect; exact $4×10k math matches 40k |
| Deadline **2026-09-08 23:59 UTC** | **VERIFIED** | Owner paste; X; blockchain.news |
| Enter: follow @Binance, repost, reply/quote (Track A: video/demo + GitHub), survey | **VERIFIED** | Owner paste; X announcement excerpt via Tavily; blockchain.news |
| Geo: US, UK, EEA, HK, SG + prohibited list blocked | **VERIFIED** | Owner paste; blockchain.news article |
| Agent OS toolkit: MCP · Skills Hub · x402/Pay · Exchange APIs · AI Pro · Agentic Wallet · Web3 APIs | **OWNER + DOCS** | Owner landing paste; developers.binance.com Agent Native + Skills Hub markdown |
| MCP endpoint `https://agent.binance.com/mcp/agentic` | **VERIFIED** | `developers.binance.com/en/docs/agent-native/mcp-server/agentic.md` |
| MCP auth = Binance.com OAuth; **no local API keys** on device; Agentic virtual sub-account; **no withdrawal scope** | **VERIFIED** | Same MCP agentic doc |
| B402 Google Form still required for merchant `/papi/v2/b402` settle credentials | **VERIFIED** | OnChainPay x402 apply docs (separate surface from MCP OAuth) |
| Blog IDs owner listed (ecosystem/tech) | **PARTIAL** | URLs recorded; headless fetch WAF’d — content taken from owner paste until browser confirm |


## 2026-09-06 — MCP docs owner-confirmed in browser

| Claim | Status | Evidence |
|---|---|---|
| Owner can open MCP agentic docs | **VERIFIED** | Screenshot `developers.binance.com/.../mcp-server/agentic` |
| Endpoint `https://agent.binance.com/mcp/agentic` | **VERIFIED** | Owner-pasted official doc + our saved markdown mirror |
| No API keys on device; withdraw never; confirm-before-execute | **VERIFIED** | Same doc |
| Do not paste endpoint into chat / open in browser to install | **VERIFIED** | Callout in official doc |


## 2026-09-06 — Cursor ↔ Binance MCP OAuth failure

| Claim | Status | Evidence |
|---|---|---|
| Error `Incompatible auth server: does not support dynamic client registration` | **VERIFIED** | Owner Cursor MCP logs 2026-09-06 |
| Binance auth metadata has **no** DCR `registration_endpoint` | **VERIFIED** | `GET https://agent.binance.com/.well-known/oauth-authorization-server` → `client_id_metadata_document_supported: true` only |
| Cursor can use static OAuth via `auth.CLIENT_ID` in `mcp.json` | **VERIFIED** | https://cursor.com/docs/mcp (Static OAuth for remote servers) |
| Official Binance MCP docs list static client ids `codex` / `grok` | **VERIFIED** | agentic MCP doc tabs |
| Official Binance MCP docs list **Cursor** as supported client | **FALSE / NOT FOUND** | Tabs: Claude Code, Claude Desktop, Codex, ChatGPT, VS Code, Grok, Other — no Cursor |


## 2026-09-06 06:04 UTC — mcp.binance.com reachability note
| Claim | Status | Evidence |
|---|---|---|
| Owner VS Code reaches mcp.binance.com enough to start HTTP MCP | **VERIFIED** | Owner logs show Running + async notification retry against that URL |
| Cloud agent POST initialize to mcp.binance.com | **BLOCKED/REDIRECT** | HTTP 302 → www.binance.com/en from this egress |


## 2026-09-06 09:17 UTC — Binance MCP live (owner VS Code)
| Claim | Status | Evidence |
|---|---|---|
| MCP connect works in VS Code for owner | **VERIFIED** | Owner screenshot: GPT read-only BTCUSDT + 24h change via MCP |
| No trade/transfer in smoke | **VERIFIED** | Owner assistant note: no trades/transfers |
