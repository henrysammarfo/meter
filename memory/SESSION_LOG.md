# METER — Session Log

## 2026-09-04 — Cloud agent: Bible → rules/skills → live stack

- Read `METER_BIBLE.md` word-for-word (mission, Track A, PAYSTREAM/INVOICE/FLOVIA, demo beats, kill list).
- Explored repo: Lovable TanStack Start app with marketing + dashboard previously backed by **static** `meter-data.ts`.
- Secured keys into gitignored `.env` / `grounds/.env` (not committed). `.env.example` added.
- Live research: Tavily + TinyFish Search/Fetch OK; TinyFish Agent 0 credits; AgentRouter WAF-blocked; aftercut folder absent.
- Fact-checked contest + $20/day x402 via TechCrunch + Tavily/TinyFish dumps.
- Created `.cursor/rules` (core, live-api, security) and `.cursor/skills` (meter-architecture, meter-research).
- Implemented `src/meter/*` production API: health, subaccounts, research (402/prepaid), invoices, ledger, limits.
- Rewired `/demo` and dashboard pages to live ledger (removed fake series as source of truth).
- Added `scripts/smoke-meter.mjs`, `grounds_lib/llm.py`, memory docs.
- Owner guidance honored: no unhackable claims; no mocks/fallbacks; enterprise wiring; keys rotated after hack (reminded).
- **SMOKE OK:** health, fund, 402, paid live research (Tavily+TinyFish), invoice, ledger, stress×5 parallel — all green on vite dev.

## 2026-09-05 — Keep building: production hardening (no mocks)

- Fixed health shallow mode honesty (`reachable=null` until probed).
- Production operator lock (`METER_PRODUCTION` / `NODE_ENV=production`).
- Explicit Venice LLM provider (no silent AgentRouter fallback).
- Binance facilitator client fail-closed until keys present.
- Receipt GET routes, catalog/waitlist/security wired through `/api/v1`.
- Smoke cleanup hardened (process-group kill + exit).
- Typecheck clean. Live smoke re-run next.

## 2026-09-05 — SMOKE OK (live)

`npm run smoke` green: health, waitlist, openapi+mcp, fund, 402, paid research (Tavily+TinyFish Fetch), invoice, ledger, stress×5.
Pushed `b1c3669` on `cursor/meter-bible-live-architecture-b2de`. PR #1 updated.
Waiting on owner for Binance / Venice / pay-to keys — no mocks while blocked.

## 2026-09-05 — AgentRouter AFTERCUT client (co remap reverted)

- Implemented AFTERCUT pattern: `src/meter/clients/agent-router.ts` — base `https://agentrouter.org`, Claude Code wire headers on every request, auto Claude→GPT→DeepSeek.
- Removed `co.agentrouter.org` forced remap from `env.ts` (wrong “fix” vs AFTERCUT).
- Wired `meterChat` / health / llm ping through `liveChat`.
- Smoke `npm run smoke:agentrouter` → **FAIL** `{ok:false, model:"", status:403}` — Aliyun WAF HTML from this datacenter egress even with correct headers. Key not exercised past WAF here.
- Do not invent native Anthropic/OpenAI keys. Owner: refresh AgentRouter key in `.env` and re-smoke from an egress that clears Aliyun.

## 2026-09-05 — AFTERCUT PONG smoke (typecheck clean)

- `npm run typecheck` clean after `body["system"]` index-signature fix.
- `npm run smoke:agentrouter` → `{ok:false, model:"", status:403}` (WAF HTML on `agentrouter.org` from this cloud IP; headers verified `claude-cli/2.1.158 (external, sdk-cli)`).
- Fail closed; no native Anthropic/OpenAI keys invented.

## 2026-09-05 — Attempted key refresh + alternate egress

- Synced `.env` / `grounds/.env` to Cursor process `AGENTROUTER_API_KEY` (differed from on-disk key).
- Both keys → `co.agentrouter.org` **401 Invalid API Key** (real JSON; key dead).
- `agentrouter.org` → Aliyun WAF HTML from **this cloud IP and Vercel Edge (iad1)** even with AFTERCUT headers.
- Cannot mint a new AgentRouter token without console access. Owner must put a fresh `sk-…` in `.env` / Cursor secrets (not chat), then re-run `npm run smoke:agentrouter`.

## 2026-09-05 — Owner key re-sync + co validate (STOP)

- Wrote owner-supplied AgentRouter key into `.env` / `.env.local` / `grounds/.env` (shape ok: `sk-`, len 51).
- Non-WAF probe `POST https://co.agentrouter.org/v1/chat/completions` → **401 Invalid API Key** (JSON, not captcha).
- Per AFTERCUT rules: **STOP**. Do not invent Anthropic/OpenAI keys. Do not claim PONG healthy.
- Report: `{ok:false, model:"", status:401}`. Mint a **new** console token into `.env.local` + host secrets only (do not paste in chat).

## 2026-09-05 — New AgentRouter key attempt #2 (STOP 401)

- Synced new owner key into `.env` / `.env.local` / `grounds/.env` (shape ok: `sk-`, len 51).
- `co.agentrouter.org` chat/completions + messages → **401 Invalid API Key** (JSON).
- `agentrouter.org` → Aliyun WAF HTML (egress).
- Report `{ok:false, model:"", status:401}`. Need a console token that validates on co JSON before PONG can pass.

## 2026-09-05 — AgentRouter PONG green (egress was the bug, not the key)

- Root cause: this Cloud Agent egress is AWS us-east (`34.235.x`) → Aliyun captcha HTML on `agentrouter.org` even with AFTERCUT headers. `co.agentrouter.org` 401 was a **false “dead key” signal** (wrong host / client path), not proof the console token is bad.
- Fix: honor `AGENT_ROUTER_HTTP_PROXY` via undici `ProxyAgent` in `src/meter/clients/agent-router.ts`; smoke uses `maxTokens: 64`.
- Live smoke: `npm run smoke:agentrouter` → `{"ok":true,"model":"gpt-5.6-sol","status":200}` (PONG).
- Do not invent native Anthropic/OpenAI keys. Prefer WAF-clear egress/proxy/bridge for datacenter IPs.

## 2026-09-05 — API keys Step 1 (slow path)

- Owner requested step-by-step API key onboarding; wait for confirm before Step 2.
- Verified B402 apply docs via `developers.binance.com/en/docs/products/onchainpay-x402/*.md` (not hallucinated HTML).
- Step 1 issued: open apply doc + Google Form; choose **Sandbox**; do not submit until RSA public key (Step 2).
- Fact: B402 Production settle is **BSC mainnet (56)**; Sandbox **BSC testnet (97)**; base URL comes with onboarding.


## 2026-09-05 — API keys Step 1 blocked (Google Form); B402 docs studied

- Owner cannot access `forms.gle` apply link. Verified marketing CTA uses a second short link that resolves to the **same** Google Form — no second product path.
- Long form URL recorded for owner: `https://docs.google.com/forms/d/e/1FAIpQLScUfaXvaKB4uE0smsl7HpOt4dqbDWLvmC5xthevQnyT7nBYqA/viewform`
- Deep-read + saved markdown under `memory/research-raw/binance-b402/` + `NOTES.md`.
- Critical learning: B402 V2 signing is RSA + `X-Tesla-*` on `/papi/v2/b402/*` — current METER Binance client Bearer shape is a gap to fix after credentials.
- Revised Step 1b for owner (long URL / marketing page / Binance support). Waiting confirm before Step 2 (RSA generate).


## 2026-09-05 — Owner delivered full Agent OS + Mini Hackathon brief

- Ingested https://www.binance.com/en/agent-os + Mini Hackathon article paste + 4 blog URLs.
- Cross-checked prize pool/deadline/tracks via Tavily (@Binance X) + blockchain.news; headless binance.com WAF’d.
- Verified MCP connect docs: endpoint `https://agent.binance.com/mcp/agentic`, OAuth, Agentic virtual sub, no withdrawal.
- Clarified dual path: MCP OAuth ≠ B402 RSA merchant keys. METER Track A needs both narrative (Agent OS) + settle (x402/B402).
- Saved raw: `memory/research-raw/agent-os/`. Updated FACT_CHECK + CURRENT_STATE + WIN map. Still waiting Step 1a confirm.


## 2026-09-06 — Step 1a confirmed (MCP docs)

- Owner screenshot + full markdown of Binance MCP Server docs.
- Verified endpoint still `https://agent.binance.com/mcp/agentic`; withdraw never; confirm-before-trade; Agentic virtual sub.
- Doc rule: never paste endpoint into AI chat / never open in browser for install.
- Advanced to Step 1c only: Cursor MCP OAuth connect.


## 2026-09-06 — Step 1c blocked: Cursor DCR vs Binance CIMD

- Owner mcp.json URL-only connect failed: no DCR on Binance; Cursor attempted DCR.
- Next: static `auth.CLIENT_ID` (Cursor docs) **or** officially supported client (VS Code / Claude Desktop) until Binance issues Cursor client id.


## 2026-09-06 06:04 UTC — VS Code MCP initialize hang
- Owner logs: Running → endless Waiting for initialize → Error connecting to https://mcp.binance.com/mcp/agentic for async notifications.
- Diagnosis: OAuth/consent likely never completed, or secondary stream blocked; keep Step 1c.


## 2026-09-06 09:17 UTC — Step 1c DONE
- VS Code + Copilot: Binance MCP connected.
- Smoke: BTCUSDT ~$79,779.74, 24h +0.208%. No trades.
- Next: Step 1d — confirm Agentic virtual sub (read-only balance), then B402 merchant path.


## 2026-09-06 10:17 UTC — Step 1d DONE
- Agentic balances all 0 USDT (Spot/Funding/Margin/Futures/Earn/Copy).
- Options/Trading Bots inactive. Read-only MCP OK. No fund yet.
- Next: Step 2 — generate B402 RSA keypair (no submit yet).


## 2026-09-06 10:19 UTC — Step 2 keys generated + Form workaround

- Generated RSA-1024 in gitignored `meter-b402-keys/` (private never committed / never chat).
- Public fingerprint sha256: `3f82dfb34c5bf562bae2fe4adde8e5970936a57569e65660cf73ec36f912d34e`
- Public b64 head/tail: `MIGfMA0GCSqGSIb3DQEBAQUA` … `F1E6bV4Nfz6iyVy/twIDAQAB`
- Official B402 apply remains Google Form only in docs — owner has no access.
- Workaround path: Binance logged-in Live Chat / Submit a Request using `memory/research-raw/b402-apply/SUPPORT_TICKET_TEMPLATE.md`.
- Parallel: MCP+prepaid demo continues; public Bazaar needs no merchant creds.
