
# Agentic Payments

Agentic Payments supports x402 payment flows on BNB Chain for AI agents, automated clients, API
providers, paid HTTP resources, and application-to-application payment use cases.

It enables sellers to request payment through an HTTP 402-style flow, buyers or agents to submit
payment authorization, and the payment flow to be verified and settled using B402 / x402
infrastructure.

> Powered by B402 / x402.

## Supported payment assets

| Token | BSC Mainnet contract                         | Methods                              |
| ----- | -------------------------------------------- | ------------------------------------ |
| U     | `0xcE24439F2D9C6a2289F741120FE202248B666666` | eip3009, permit2-exact, permit2-upto |
| USD1  | `0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d` | eip3009, permit2-exact, permit2-upto |
| USDT  | `0x55d398326f99059fF775485246999027B3197955` | permit2-exact, permit2-upto          |
| USDC  | `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d` | permit2-exact, permit2-upto          |

B402 is Binance's implementation of the [x402 payment protocol](https://github.com/coinbase/x402) on
BNB Smart Chain. It enables instant, automatic stablecoin payments directly over HTTP — services
charge buyers (human users or autonomous AI agents) per request, settled on-chain in seconds, with
gas sponsored by B402. The recommended `/papi/v2/b402/*` API conforms to the
[x402 v2 specification](https://github.com/coinbase/x402/blob/main/specs/x402-specification-v2.md);
a V1 API (`/papi/v1/b402/*`) is also available for legacy clients.

### Who B402 is for

- **Sellers** — API providers, paywall operators, AI tool authors, and microservice owners who want
  to monetize HTTP endpoints per request without building wallets, billing, or subscription
  infrastructure.
- **Buyers** — AI agents, dApps, and HTTP clients that pay for resources autonomously by signing
  EIP-712 authorizations. Buyers do not run wallets or hold gas — they sign off-chain and B402
  executes the on-chain transfer.

### Use cases

- **Per-request API billing** — charge fractions of a cent per call without managing API keys or
  invoices.
- **AI agent payments** — let autonomous agents pay for tools, data, and inference without
  human-in-the-loop credentials.
- **Paywalled content** — gate articles, downloads, or premium endpoints with HTTP 402.
- **Microservice metering** — charge internal or external consumers per call against a shared
  contract.
- **Discovery of paid endpoints** — be found by AI agents via [B402 Bazaar](b402-bazaar.md) without
  manual onboarding.

### How It Works

The x402 protocol leverages the HTTP `402 Payment Required` status code to create a standardized
payment flow for web resources:

1. A client requests a paid resource from the seller.
2. The seller responds with HTTP **402** and includes payment requirements (token, amount, recipient
   address, and the addresses needed to construct an EIP-712 signature) in the response body.
3. The buyer signs an EIP-712 authorization off-chain (no on-chain transaction needed from the
   buyer).
4. The buyer resubmits the request with the signed payment attached.
5. The seller calls B402 to **verify** the signature and then **settle** the payment on-chain.
6. B402 sponsors the gas and executes the token transfer directly from buyer to seller.
7. The seller delivers the paid resource.

For the full sequence diagram and step-by-step walkthrough, see
[Typical integration flow](basics/8.typical-integration-flow.md).

### Key roles

| Role                              | Description                                                                                                                                                                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Buyer** (AI agent / user)       | The payer who signs an EIP-712 authorization off-chain to approve the token transfer. Can be a human user or an autonomous AI agent.                                                                                                                   |
| **Seller** (merchant / developer) | Provides paid APIs or services. Integrates B402 via HTTP. Forwards the buyer's signed payment to the B402 facilitator for verification and execution.                                                                                                  |
| **Facilitator** (B402)            | Verifies signatures off-chain (`/verify`), then sponsors gas and executes the on-chain token transfer (`/settle`). All token transfers occur strictly peer-to-peer on the public blockchain from the buyer's wallet directly to the merchant's wallet. |

### Key features

- **Stateless** — no sessions, accounts, or held balances. Each request is its own transaction.
- **HTTP-native** — payments flow through standard request/response with the `402` status code.
  Works with any HTTP server, framework, or client.
- **Gas-sponsored** — sellers don't need BNB to operate. B402 pays the gas for every settle.
- **Multiple payment methods** — `eip3009` for native EIP-3009 tokens (U, USD1) and `permit2-exact`
  / `permit2-upto` for any ERC-20 (USDC, USDT, etc.).
- **Discoverable** — opt your endpoints into [B402 Bazaar](b402-bazaar.md) for AI-agent discovery
  simply by attaching metadata on settle.
- **CDP wire-shape compatible** — the V2 `PaymentPayload` and Bazaar metadata blob match Coinbase's
  x402 spec field-for-field, so client libraries built for CDP work against B402 with one URL
  change.

### Supported payment methods

| Token    | Contract (BSC Mainnet)                       | `eip3009` | `permit2-exact` | `permit2-upto` |
| -------- | -------------------------------------------- | :-------: | :-------------: | :------------: |
| **U**    | `0xcE24439F2D9C6a2289F741120FE202248B666666` |    ✅     |       ✅        |       ✅       |
| **USD1** | `0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d` |    ✅     |       ✅        |       ✅       |
| **USDT** | `0x55d398326f99059fF775485246999027B3197955` |     —     |       ✅        |       ✅       |
| **USDC** | `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d` |     —     |       ✅        |       ✅       |

| Method          | Description                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------------- |
| `eip3009`       | EIP-3009 native `transferWithAuthorization`. Only available for tokens with built-in EIP-3009 support (U, USD1). |
| `permit2-exact` | Permit2 exact-amount transfer. Works with any ERC-20 token.                                                      |
| `permit2-upto`  | Permit2 up-to-amount transfer (pay-as-you-go). Works with any ERC-20 token.                                      |

### Current status

B402 is **live on BNB Smart Chain (BSC) Testnet** for external partner onboarding. Production (BSC
Mainnet) access is granted on request — [apply here](https://forms.gle/aUQvxUETfGMzyTky5) to get
your API credentials. See [Environments and API base URLs](basics/4.base-urls.md) for endpoint
details. Expansion to other EVM-compatible networks is planned.

### What to read next

- [Quick Start](quick-start.md) — step-by-step guide to your first integration.
- [Typical integration flow](basics/8.typical-integration-flow.md) — full sequence diagram and
  per-step explanation of the protocol.
- [Integration Guideline](integration-guideline.md) — production prerequisites, rate limits, and
  security best practices.
- [B402 Bazaar](b402-bazaar.md) — make your endpoint discoverable to AI agents.
- [Open APIs V2](open-apis-v2/1.get-supported-configurations.md) — detailed API reference for
  `/supported`, `/verify`, and `/settle` (x402 v2 spec-conformant).
- [Permit2 Signing Guide](open-apis-v2/4.permit2-signing.md) — the EIP-712 typed data shape for
  Permit2 signatures, with viem and ethers.js v6 reference implementations.

---

### Disclaimer

<small>

This documentation describes Binance x402 (B402), a developer-facing technical service that supports
verification of user-signed x402-compatible payment payloads and submission of corresponding
on-chain transactions on supported blockchain networks.

Binance x402 (B402) is provided as technical infrastructure and software tooling only. It is not
intended to constitute, and should not be construed as, any of the following:

- a bank account, deposit, stored-value facility, e-money product, or custodial wallet;
- a payment account, payment instrument, remittance, money transmission, or funds transfer service;
- brokerage, exchange, dealing, clearing, settlement assurance, or other regulated financial
  service;
- investment, legal, tax, accounting, or regulatory advice;
- an offer, invitation, solicitation, recommendation, or endorsement to buy, sell, hold, transfer,
  or use any digital asset, token, or network.

B402 does not take possession, custody, or control of user funds or payment tokens as part of the
standard flow described in this documentation. In the supported integration model, digital assets
move directly on-chain between addresses designated by the user and the merchant or service
provider. B402's role is limited to technical functions such as message validation, signature
verification, transaction submission, and related API support on supported networks.

Use of B402 does not relieve any developer, merchant, integrator, application provider, or other
participant of its own responsibility to assess and comply with all applicable laws, rules,
regulations, licensing, sanctions, tax, consumer protection, data protection, and disclosure
obligations in each relevant jurisdiction. Each integrator remains solely responsible for:

- determining whether and how B402 may be used in its product or service;
- ensuring that all required notices, disclosures, consents, and terms are provided to end users;
- evaluating whether any activity involving digital assets, blockchain-based transfers, or service
  monetization may be regulated in applicable jurisdictions;
- implementing its own compliance, fraud prevention, transaction monitoring, screening, risk
  management, and customer support processes as required.

Blockchain networks, smart contracts, token standards, third-party wallets, signatures, RPC
infrastructure, and related software involve operational, technical, and legal risks, including
failed transactions, reversibility limitations, network congestion, software bugs, forks, validator
or sequencer issues, smart contract vulnerabilities, signature misuse, incorrect addressing, and
asset loss. On-chain transactions may be irreversible once confirmed. Binance x402 (B402) does not
guarantee transaction success, network availability, confirmation times, compatibility, merchant
outcomes, user solvency, or continued support for any blockchain, token, standard, or integration.

This documentation is provided for general informational and integration purposes only and may be
updated, suspended, or withdrawn at any time. Access to or use of B402 may be subject to separate
eligibility requirements, onboarding, contractual terms, technical restrictions, and jurisdictional
limitations. Availability may differ by entity, user type, product configuration, and region.

To the extent permitted by applicable law, Binance x402 (B402) and its providers disclaim liability
for indirect, incidental, consequential, special, exemplary, or punitive damages, and for losses
arising from third-party acts or omissions, blockchain events, token issuer actions, smart contract
behavior, wallet compromise, configuration errors, unsupported use cases, or user/integrator
non-compliance.

You should obtain independent legal, regulatory, tax, and technical advice before deploying Binance
x402 (B402) in production.

</small>
