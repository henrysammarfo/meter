# Binance B402 / OnChainPay x402 — study notes

**Fetched:** 2026-09-05  
**Sources:** `developers.binance.com/en/docs/products/onchainpay-x402/*.md` (markdown mirrors), marketing `binance.info/en/binancex402`, live Bazaar probe.

## Naming (do not confuse)

| Name in wild | What it is |
|---|---|
| Binance x402 / B402 / OnChainPay x402 | Same product family: Binance facilitator for HTTP 402 agentic payments on **BNB Smart Chain** |
| Agent OS | Broader stack: APIs + Wallet Agentic Hub + x402 + Skill Hub + MCP |
| x402.org facilitator | Independent Coinbase/community testnet facilitator — **not** Binance Production |

## Apply / credentials (verified)

Official apply path is a **Google Form only** (no alternate public email in docs):

- Short links: `https://forms.gle/aUQvxUETfGMzyTky5` (docs) and `https://forms.gle/xdkrQt1WTnQtK73R6` (marketing "Apply for API Key" button)
- Both resolve to the **same** form:  
  `https://docs.google.com/forms/d/e/1FAIpQLScUfaXvaKB4uE0smsl7HpOt4dqbDWLvmC5xthevQnyT7nBYqA/viewform`
- Marketing CTA in page JS: `window.open("https://forms.gle/xdkrQt1WTnQtK73R6","_blank")`

**Required per environment (Sandbox ≠ Production):**

1. Business name  
2. Email  
3. EVM wallet `0x…` (testnet for Sandbox, mainnet for Production)  
4. RSA **public** key (partner generates; private stays with partner)  
5. IP whitelist  
6. Optional webhook URL  

**Issued per environment:** `clientId`, `accessToken`, webhook verify public key, and the **authenticated base URL** (not published; handed at onboarding).

## Auth model (critical for METER client)

Authenticated paths: `{BASE_URL}/papi/v2/b402/{supported,verify,settle}`

Headers (docs name them `X-Tesla-*`):

| Header | Value |
|---|---|
| `Content-Type` | `application/json` |
| `X-Tesla-ClientId` | onboarding `clientId` |
| `X-Tesla-SignAccessToken` | onboarding `accessToken` |
| `X-Tesla-Timestamp` | ms epoch |
| `X-Tesla-Signature` | Base64 RSA-SHA256 of `jsonBody + timestamp` |

RSA: **1024-bit**, PKCS#8 DER base64 private key; public key submitted at apply. Timestamp skew window: **5 minutes**.

**METER gap (fact):** current `src/meter/clients/binance.ts` uses `Authorization: Bearer` against `{base}/verify` and `{base}/settle`. That matches a generic x402 facilitator shape, **not** the published B402 V2 signed Open API. Must be rewritten to RSA + `X-Tesla-*` + `/papi/v2/b402/*` once Sandbox credentials arrive. Fail-closed until then is correct.

## Chains & assets (verified)

| Env | CAIP-2 | Chain ID |
|---|---|---|
| Production | `eip155:56` | 56 BSC Mainnet |
| Sandbox | `eip155:97` | 97 BSC Testnet |

Mainnet tokens (intro): U, USD1 (eip3009 + permit2), USDT/USDC (permit2 only).  
Methods: `eip3009`, `permit2-exact`, `permit2-upto`. Gas sponsored by B402 on settle.  
Permit2 contract (both nets): `0x000000000022D473030F116dDEE9F6B43aC78BA3`.

## Flow (seller)

1. Cache `POST /supported` → echo full `kinds[].extra` into every HTTP 402  
2. Buyer signs EIP-712 off-chain (no gas)  
3. Seller `POST /verify` then `POST /settle`  
4. Rate limits: verify 100 rps, settle 20 rps per merchant  
5. Settle latency estimates: ~10s / ~25s / ~45s by size  

## Bazaar (public, no auth)

Production discovery base:  
`https://www.binance.com/bapi/ramp/v1/public/ramp/b402`  
Live probe 2026-09-05: 25 resources, all `eip155:56`, schemes `eip3009` / `permit2-exact`.  
Listing = attach `extensions.bazaar` on V2 settle (opt-in, ~30s index).

## Security practices from docs

- Never settle without verify  
- IP whitelist  
- App-layer idempotency on payment ids (B402 also keys on nonce/network/payer)  
- Do not hardcode `extra` — refresh from `/supported`  
- Private RSA key never in repo / logs / client JS  

## Owner blocker

Google Forms inaccessible to owner → Step 1 pivots to: try long form URL, marketing page CTA, or Binance logged-in support feedback while we prepare RSA + wallet offline.
