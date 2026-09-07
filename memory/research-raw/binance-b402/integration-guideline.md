# Integration Guideline

This guide covers production-readiness considerations for a B402 integration: security, rate limits,
and settlement response timing. For the step-by-step integration flow, see
[Quick Start](quick-start.md).

### Prerequisites

Before you begin, ensure you have completed the partner onboarding and obtained your API credentials
(`clientId` and `accessToken`).

See [Apply partner developer account](basics/6.apply-developer-account.md) for the full list of
required materials and onboarding steps.

### Security Best Practices

- **Forward the full `extra` object to buyers in every 402 response.** When returning HTTP
  `402 Payment Required`, copy the entire `kinds[].extra` from the cached `/supported` response into
  `paymentRequirements.extra` — `name`, `version`, `assetTransferMethod`, `signerAddress`, and (for
  `permit2-*`) `spenderAddress`. Buyers cannot call `/supported` themselves (it requires merchant
  credentials) and need these to build the EIP-712 typed-data domain and a valid Permit2 signature.
  Do not hardcode — `/supported` is the single source of truth; missing or stale values cause buyer
  signatures to be rejected.
- **Store your private key securely.** Never expose your RSA private key in client-side code, public
  repositories, or logs.
- **Always verify before settling.** Call `/verify` to validate the buyer's EIP-712 signature before
  calling `/settle`. Never settle an unverified payment.
- **Use IP whitelisting.** Restrict API access to your registered server IPs to prevent unauthorized
  calls.
- **Validate settlement responses.** Check the `success` field and on-chain `transaction` hash in
  the settlement response to confirm the transfer completed successfully. See
  [Payment status](basics/7.payment-status.md).
- **Guard against duplicate settlements.** Track payment identifiers to prevent settling the same
  payment more than once. B402 enforces idempotency on `(nonce, network, payer)`, but merchants
  should guard at their application layer as well.

### Rate Limits

| Endpoint               | Limit                         |
| ---------------------- | ----------------------------- |
| `/papi/v2/b402/verify` | 100 requests/sec per merchant |
| `/papi/v2/b402/settle` | 20 requests/sec per merchant  |

Exceeding the rate limit returns HTTP `429 Too Many Requests`. Implement exponential backoff and
retry logic on the client side.

### Settlement Response Times

| Transaction Amount | Estimated Response Time |
| ------------------ | ----------------------- |
| Small amounts      | ~10 seconds             |
| Medium amounts     | ~25 seconds             |
| Large amounts      | ~45 seconds             |

> **Note:** These are estimates. Actual response times depend on network congestion and are adjusted
> dynamically. For large transactions, consider an asynchronous callback or polling pattern rather
> than blocking on the settlement response.
