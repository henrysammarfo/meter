# Environments and API base URLs

B402 has two surfaces with different access models. Use the table that matches the endpoint you're
calling.

### Authenticated APIs — `/papi/v2/b402/*`

Used for `/supported`, `/verify`, and `/settle`. These require RSA-SHA256-signed requests with a
registered `clientId`, `accessToken`, and IP-whitelisted source IP — see
[API request signing](3.request-signing.md) and
[Apply partner developer account](6.apply-developer-account.md).

| Environment       | Chain       | Chain ID | Base URL                     |
| ----------------- | ----------- | -------- | ---------------------------- |
| Sandbox (Testnet) | BSC Testnet | 97       | Please contact us for access |
| Production        | BSC Mainnet | 56       | Please contact us for access |

> **Why "contact us"?** Production access requires merchant onboarding (clientId issuance, RSA
> public-key registration, source-IP whitelisting). The base URL is handed out together with these
> credentials so merchants don't accidentally point a sandbox-issued credential at production. Apply
> via [Apply partner developer account](6.apply-developer-account.md).

All code examples in these docs use `{BASE_URL}` as a placeholder — substitute the value provided to
you during onboarding. Endpoint paths append directly: `{BASE_URL}/papi/v2/b402/supported`.

### Public discovery APIs — B402 Bazaar

Used for `/bazaar/{resources, search, merchant}` (the [B402 Bazaar](../b402-bazaar.md) catalog).
These are **public, read-only, and require no authentication** — any client can call them without a
`clientId` or signature.

| Environment       | Chain       | Chain ID | Base URL                                                |
| ----------------- | ----------- | -------- | ------------------------------------------------------- |
| Sandbox (Testnet) | BSC Testnet | 97       | Please contact us for access                            |
| Production        | BSC Mainnet | 56       | `https://www.binance.com/bapi/ramp/v1/public/ramp/b402` |

The discovery base URL is stable and safe to hardcode in client SDKs. Discovery paths are documented
on [B402 Bazaar — Verifying your listing](../b402-bazaar.md#verifying-your-listing).

> **Note:** Discovery responses are wrapped in Binance's standard BAPI envelope
> (`{code, message, messageDetail, data, success}`); the CDP-compatible payload is in `data`.
> CDP-built client SDKs need to unwrap one extra layer compared to calling
> `api.cdp.coinbase.com/platform/v2/x402/discovery/*` directly.

It is recommended to start with the **Sandbox (Testnet)** environment first. Once integration
testing is complete, contact us for Production (BSC Mainnet) credentials.
