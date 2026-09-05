# Verify Payment (V2)

```
POST /papi/v2/b402/verify
```

Validates a signed payment payload off-chain. No gas is consumed and no on-chain transaction is
submitted. Use this endpoint to check that a payment is well-formed and the signature is valid
before calling `/settle`.

> **Differences from V1** ([`/papi/v1/b402/verify`](../open-apis/2.verify-payment.md)):
>
> | V1                                                              | V2                                                                                                                          |
> | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
> | `x402Version: 1`                                                | `x402Version: 2` (strict — any other value rejected with `invalid_x402_version`)                                            |
> | `paymentPayload.scheme` / `paymentPayload.network` at top level | removed — client echoes the chosen requirement via `paymentPayload.accepted`                                                |
> | —                                                               | `paymentPayload.resource` promoted to top level of `paymentPayload`                                                         |
> | `paymentRequirements.scheme: "exact"` only                      | `paymentRequirements.scheme` must be `"exact"` or `"upto"`; any other value rejected with `invalid_scheme`                  |
> | `extra.facilitatorAddress`                                      | replaced by `extra.signerAddress` + `extra.spenderAddress`                                                                  |
> | `invalidMessage` in response                                    | omitted from wire by default; populated only for structural-error codes (`invalid_payload`, `invalid_payment_requirements`) |

### Request Body

| **Field**                                                       | **Type** | **Mandatory** | **Remarks**                                                                                                                                                                                         |
| --------------------------------------------------------------- | -------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| x402Version                                                     | integer  | Yes           | Must be `2`. Any other value → `invalid_x402_version`.                                                                                                                                              |
| paymentPayload                                                  | object   | Yes           | The signed payment payload                                                                                                                                                                          |
| paymentPayload.x402Version                                      | integer  | Yes           | Protocol version (should match top-level `x402Version`)                                                                                                                                             |
| paymentPayload.resource                                         | object   | No            | `ResourceInfo` object describing the resource the payment grants access to (x402 v2 §5.1). Optional per spec but strongly recommended for traceability.                                             |
| paymentPayload.resource.url                                     | string   | Yes \*        | URL of the protected resource. \*Required when `paymentPayload.resource` is present.                                                                                                                |
| paymentPayload.resource.description                             | string   | No            | Human-readable description of the resource                                                                                                                                                          |
| paymentPayload.resource.mimeType                                | string   | No            | MIME type of the expected response                                                                                                                                                                  |
| paymentPayload.accepted                                         | object   | Yes           | The `PaymentRequirements` kind the client has chosen to fulfill (echoed from `/supported`)                                                                                                          |
| paymentPayload.accepted.scheme                                  | string   | Yes           | `"exact"` or `"upto"`. Any other value → `invalid_scheme`.                                                                                                                                          |
| paymentPayload.accepted.network                                 | string   | Yes           | CAIP-2 network identifier                                                                                                                                                                           |
| paymentPayload.accepted.amount                                  | string   | Yes           | Required payment amount in atomic units                                                                                                                                                             |
| paymentPayload.accepted.asset                                   | string   | Yes           | Token contract address                                                                                                                                                                              |
| paymentPayload.accepted.payTo                                   | string   | Yes           | Merchant wallet address                                                                                                                                                                             |
| paymentPayload.accepted.maxTimeoutSeconds                       | integer  | Yes           | Maximum settlement timeout in seconds                                                                                                                                                               |
| paymentPayload.accepted.extra                                   | object   | Yes           | Optional per x402 v2 spec; **required in b402** because `extra.assetTransferMethod` drives handler dispatch.                                                                                        |
| paymentPayload.accepted.extra.name                              | string   | Yes           | Token EIP-712 domain name                                                                                                                                                                           |
| paymentPayload.accepted.extra.version                           | string   | Yes           | Token EIP-712 domain version                                                                                                                                                                        |
| paymentPayload.accepted.extra.assetTransferMethod               | string   | Yes           | `"eip3009"`, `"permit2-exact"`, or `"permit2-upto"`                                                                                                                                                 |
| paymentPayload.accepted.extra.signerAddress                     | string   | Yes           | Facilitator EOA (from `/supported`)                                                                                                                                                                 |
| paymentPayload.accepted.extra.spenderAddress                    | string   | Conditional   | Permit2 proxy contract (from `/supported`). Required for `permit2-*`; absent for `eip3009`.                                                                                                         |
| paymentPayload.payload                                          | object   | Yes           | Signature + authorization details                                                                                                                                                                   |
| paymentPayload.payload.signature                                | string   | Yes           | EIP-712 signature (`0x`-prefixed hex, 65 bytes)                                                                                                                                                     |
| paymentPayload.payload.authorization                            | object   | Conditional   | **EIP-3009 only.** Required when `assetTransferMethod == "eip3009"`.                                                                                                                                |
| paymentPayload.payload.authorization.from                       | string   | Conditional   | Payer wallet address                                                                                                                                                                                |
| paymentPayload.payload.authorization.to                         | string   | Conditional   | Recipient wallet address                                                                                                                                                                            |
| paymentPayload.payload.authorization.value                      | string   | Conditional   | Amount in atomic units                                                                                                                                                                              |
| paymentPayload.payload.authorization.validAfter                 | string   | Conditional   | Unix timestamp (seconds) — signature valid after                                                                                                                                                    |
| paymentPayload.payload.authorization.validBefore                | string   | Conditional   | Unix timestamp (seconds) — signature valid before                                                                                                                                                   |
| paymentPayload.payload.authorization.nonce                      | string   | Conditional   | Unique nonce (32-byte hex)                                                                                                                                                                          |
| paymentPayload.payload.permit2Authorization                     | object   | Conditional   | **Permit2 only.** Required when `assetTransferMethod` is `"permit2-exact"` or `"permit2-upto"`.                                                                                                     |
| paymentPayload.payload.permit2Authorization.permitted.token     | string   | Conditional   | Token contract address                                                                                                                                                                              |
| paymentPayload.payload.permit2Authorization.permitted.amount    | string   | Conditional   | Maximum authorised amount (atomic units)                                                                                                                                                            |
| paymentPayload.payload.permit2Authorization.from                | string   | Conditional   | Payer (token owner) address — signer of the Permit2 signature                                                                                                                                       |
| paymentPayload.payload.permit2Authorization.spender             | string   | Conditional   | Must match `accepted.extra.spenderAddress`                                                                                                                                                          |
| paymentPayload.payload.permit2Authorization.nonce               | string   | Conditional   | Permit2 nonce                                                                                                                                                                                       |
| paymentPayload.payload.permit2Authorization.deadline            | string   | Conditional   | Unix timestamp (seconds) when the permit expires                                                                                                                                                    |
| paymentPayload.payload.permit2Authorization.witness             | object   | Conditional   | Witness data included in the EIP-712 signed message                                                                                                                                                 |
| paymentPayload.payload.permit2Authorization.witness.to          | string   | Conditional   | Recipient address. Must match `accepted.payTo`. Enforced on-chain by the proxy contract.                                                                                                            |
| paymentPayload.payload.permit2Authorization.witness.facilitator | string   | Conditional   | Facilitator EOA bound to this authorisation. **`permit2-upto` only**; absent for `permit2-exact`.                                                                                                   |
| paymentPayload.payload.permit2Authorization.witness.validAfter  | string   | Conditional   | Earliest Unix timestamp (seconds) at which the transfer can execute. `"0"` means immediately.                                                                                                       |
| paymentPayload.extensions                                       | object   | No            | x402 v2 extensions object. Set `extensions.bazaar` to make your endpoint discoverable via [B402 Bazaar](../b402-bazaar.md). Send `{}` or omit if unused.                                            |
| paymentRequirements                                             | object   | Yes           | Expected payment requirements from the resource server. Same shape as `paymentPayload.accepted`.                                                                                                    |
| paymentRequirements.scheme                                      | string   | Yes           | `"exact"` or `"upto"`. Any other value → `invalid_scheme`.                                                                                                                                          |
| paymentRequirements.network                                     | string   | Yes           | CAIP-2 network identifier                                                                                                                                                                           |
| paymentRequirements.amount                                      | string   | Yes           | Required payment amount in atomic units                                                                                                                                                             |
| paymentRequirements.asset                                       | string   | Yes           | Token contract address                                                                                                                                                                              |
| paymentRequirements.payTo                                       | string   | Yes           | Merchant wallet address                                                                                                                                                                             |
| paymentRequirements.maxTimeoutSeconds                           | integer  | Yes           | Maximum settlement timeout in seconds (x402 v2 spec §5.1.2)                                                                                                                                         |
| paymentRequirements.extra                                       | object   | Yes           | Optional per x402 v2 spec; **required in b402** because `extra.assetTransferMethod` drives handler dispatch. Must match a `kind` from `/supported`; same fields as `paymentPayload.accepted.extra`. |

> **Merchant responsibility — forwarding `extra` to buyers:** The merchant MUST populate
> `paymentRequirements.extra` (and the identical `paymentPayload.accepted.extra`) with values copied
> from the matching `kinds[]` entry in the [`/supported`](1.get-supported-configurations.md)
> response. In particular, `extra.signerAddress` and `extra.spenderAddress` (for `permit2-*`) must
> be surfaced to the buyer in the upstream HTTP 402 response — buyers have no other channel to
> discover them. Omitting them will cause buyer-side signing to fail or produce signatures that B402
> rejects with `invalid_payload`. See
> [Forwarding Addresses to Buyers](1.get-supported-configurations.md#forwarding-addresses-to-buyers-merchant-responsibility).

> **Conditional fields:** Required depending on `assetTransferMethod`:
>
> - **`eip3009`** → `payload.authorization.*` required; `payload.permit2Authorization` must be
>   absent.
> - **`permit2-exact` / `permit2-upto`** → `payload.permit2Authorization.*` required;
>   `payload.authorization` must be absent.
> - **`permit2-upto` only** → `payload.permit2Authorization.witness.facilitator` additionally
>   required; it must equal `extra.signerAddress`.

> **Signing `permit2-exact`:** The stock `@x402/evm` client does not ship a Permit2 signer. See the
> [Permit2 Signing Guide](./4.permit2-signing.md) for the EIP-712 typed data shape and TypeScript
> reference (viem / ethers.js).

#### Example — EIP-3009

```json
{
  "x402Version": 2,
  "paymentPayload": {
    "x402Version": 2,
    "resource": {
      "url": "https://api.example.com/premium/data",
      "description": "Premium API access",
      "mimeType": "application/json"
    },
    "accepted": {
      "scheme": "exact",
      "network": "eip155:56",
      "amount": "1000000",
      "asset": "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
      "payTo": "0x8B3a350e2f3E6B9cC6FB10Fd106bA08f08bec5D2",
      "maxTimeoutSeconds": 300,
      "extra": {
        "name": "USD Coin",
        "version": "2",
        "assetTransferMethod": "eip3009",
        "signerAddress": "0x1111111111111111111111111111111111111111"
      }
    },
    "payload": {
      "signature": "0xf3746613c2d920b5fdabc0856f2aeb2d4f88ee6037b8cc5d04a71a4462f134801234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b",
      "authorization": {
        "from": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        "to": "0x8B3a350e2f3E6B9cC6FB10Fd106bA08f08bec5D2",
        "value": "1000000",
        "validAfter": "0",
        "validBefore": "1710000600",
        "nonce": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
      }
    }
  },
  "paymentRequirements": {
    "scheme": "exact",
    "network": "eip155:56",
    "amount": "1000000",
    "asset": "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    "payTo": "0x8B3a350e2f3E6B9cC6FB10Fd106bA08f08bec5D2",
    "maxTimeoutSeconds": 300,
    "extra": {
      "name": "USD Coin",
      "version": "2",
      "assetTransferMethod": "eip3009",
      "signerAddress": "0x1111111111111111111111111111111111111111"
    }
  }
}
```

#### Example — Permit2 Exact (any ERC-20)

```json
{
  "x402Version": 2,
  "paymentPayload": {
    "x402Version": 2,
    "resource": {
      "url": "https://api.example.com/premium/data",
      "description": "Premium API access",
      "mimeType": "application/json"
    },
    "accepted": {
      "scheme": "exact",
      "network": "eip155:56",
      "amount": "5000000",
      "asset": "0x55d398326f99059ff775485246999027b3197955",
      "payTo": "0x8B3a350e2f3E6B9cC6FB10Fd106bA08f08bec5D2",
      "maxTimeoutSeconds": 300,
      "extra": {
        "name": "Tether USD",
        "version": "1",
        "assetTransferMethod": "permit2-exact",
        "signerAddress": "0x1111111111111111111111111111111111111111",
        "spenderAddress": "0x2222222222222222222222222222222222222222"
      }
    },
    "payload": {
      "signature": "0xaabbccdd...65bytes...eeff",
      "permit2Authorization": {
        "permitted": {
          "token": "0x55d398326f99059ff775485246999027b3197955",
          "amount": "5000000"
        },
        "from": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        "spender": "0x2222222222222222222222222222222222222222",
        "nonce": "1",
        "deadline": "1710000600",
        "witness": {
          "to": "0x8B3a350e2f3E6B9cC6FB10Fd106bA08f08bec5D2",
          "validAfter": "0"
        }
      }
    }
  },
  "paymentRequirements": {
    "scheme": "exact",
    "network": "eip155:56",
    "amount": "5000000",
    "asset": "0x55d398326f99059ff775485246999027b3197955",
    "payTo": "0x8B3a350e2f3E6B9cC6FB10Fd106bA08f08bec5D2",
    "maxTimeoutSeconds": 300,
    "extra": {
      "name": "Tether USD",
      "version": "1",
      "assetTransferMethod": "permit2-exact",
      "signerAddress": "0x1111111111111111111111111111111111111111",
      "spenderAddress": "0x2222222222222222222222222222222222222222"
    }
  }
}
```

#### Example — Permit2 Upto (pay-as-you-go)

```json
{
  "x402Version": 2,
  "paymentPayload": {
    "x402Version": 2,
    "resource": {
      "url": "https://ai.example.com/api/v1/chat",
      "description": "AI Agent API - per-request billing",
      "mimeType": "application/json"
    },
    "accepted": {
      "scheme": "upto",
      "network": "eip155:56",
      "amount": "100000000",
      "asset": "0x55d398326f99059ff775485246999027b3197955",
      "payTo": "0x8B3a350e2f3E6B9cC6FB10Fd106bA08f08bec5D2",
      "maxTimeoutSeconds": 300,
      "extra": {
        "name": "Tether USD",
        "version": "1",
        "assetTransferMethod": "permit2-upto",
        "signerAddress": "0x1111111111111111111111111111111111111111",
        "spenderAddress": "0x3333333333333333333333333333333333333333"
      }
    },
    "payload": {
      "signature": "0x112233...65bytes...4455",
      "permit2Authorization": {
        "permitted": {
          "token": "0x55d398326f99059ff775485246999027b3197955",
          "amount": "100000000"
        },
        "from": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        "spender": "0x3333333333333333333333333333333333333333",
        "nonce": "5",
        "deadline": "1710086400",
        "witness": {
          "to": "0x8B3a350e2f3E6B9cC6FB10Fd106bA08f08bec5D2",
          "facilitator": "0x1111111111111111111111111111111111111111",
          "validAfter": "0"
        }
      }
    }
  },
  "paymentRequirements": {
    "scheme": "upto",
    "network": "eip155:56",
    "amount": "100000000",
    "asset": "0x55d398326f99059ff775485246999027b3197955",
    "payTo": "0x8B3a350e2f3E6B9cC6FB10Fd106bA08f08bec5D2",
    "maxTimeoutSeconds": 300,
    "extra": {
      "name": "Tether USD",
      "version": "1",
      "assetTransferMethod": "permit2-upto",
      "signerAddress": "0x1111111111111111111111111111111111111111",
      "spenderAddress": "0x3333333333333333333333333333333333333333"
    }
  }
}
```

> In this example, the buyer authorised up to 100 USDT (`"100000000"`). The actual amount to charge
> is specified later in the [`/settle`](3.settle-payment.md) call via the `settleAmount` field.

### Response Body

| **Field**      | **Type** | **Presence**                    | **Remarks**                                                                                                                                                    |
| -------------- | -------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| isValid        | boolean  | Always                          | Whether the payment payload is valid                                                                                                                           |
| payer          | string   | Always                          | Recovered payer wallet address from the signature                                                                                                              |
| invalidReason  | string   | Only when `isValid=false`       | x402 v2 standard error code. See table below.                                                                                                                  |
| invalidMessage | string   | Only for structural-error codes | Human-readable debug context. Populated only when `invalidReason ∈ {invalid_payload, invalid_payment_requirements}`. Absent for all other codes (spec-strict). |

> `invalidMessage` is populated only when `invalidReason` is a structural-error code
> (`invalid_payload`, `invalid_payment_requirements`) — i.e., the request shape itself is malformed.
> Spec-strict codes (signature/authorization failures, `insufficient_funds`) carry no
> `invalidMessage`; debug context for those is retained in server logs only.

#### Example — Valid Payment

```json
{
  "code": "000000",
  "message": "success",
  "data": {
    "isValid": true,
    "payer": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  }
}
```

#### Example — Invalid Payment

```json
{
  "code": "000000",
  "message": "success",
  "data": {
    "isValid": false,
    "invalidReason": "invalid_exact_evm_payload_signature",
    "payer": "0x0000000000000000000000000000000000000000"
  }
}
```

> **Notes:**
>
> - An invalid payment still returns HTTP `200` with `code: "000000"`. Check the `isValid` field in
>   `data` for the verification outcome. HTTP-level errors (400 / 401 / etc.) indicate request-level
>   problems (missing parameters, authentication failure, etc.).
> - `/verify` is **read-only and off-chain**. It can be called repeatedly at no cost.
> - In `permit2-upto` mode, `/verify` checks that the authorised cap covers `amount`. The actual
>   settlement amount (which may be lower) is specified in the subsequent
>   [`/settle`](3.settle-payment.md) call via the `settleAmount` field.
> - Calling `/verify` before `/settle` is recommended but not mandatory. If you skip `/verify`, the
>   `/settle` endpoint will still validate the payment before executing it.

### Envelope Rejection Rules

The following envelope-level checks run before payload validation. They short-circuit with a fixed
`invalidReason` regardless of the remainder of the request:

| Condition                                                             | `invalidReason`        |
| --------------------------------------------------------------------- | ---------------------- |
| Request body missing / unparseable                                    | `invalid_payload`      |
| `x402Version` missing or `!= 2`                                       | `invalid_x402_version` |
| `paymentRequirements.scheme` is set and not in `{"exact","upto"}`     | `invalid_scheme`       |
| `paymentPayload.accepted.scheme` is set and not in `{"exact","upto"}` | `invalid_scheme`       |

### `invalidReason` / `errorReason` Values

The V2 endpoints emit x402 v2 standard error codes. `invalidReason` appears on `/verify` responses;
`errorReason` on `/settle` responses (see [`/settle` — Settle Payment](3.settle-payment.md)).

| **Value**                                                | **Phase** | **Description**                                                                                                       |
| -------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------- |
| `insufficient_funds`                                     | verify    | Payer token balance below required amount                                                                             |
| `invalid_exact_evm_payload_signature`                    | verify    | EIP-712 / Permit2 signature invalid                                                                                   |
| `invalid_exact_evm_payload_authorization_valid_after`    | verify    | Authorization not yet valid                                                                                           |
| `invalid_exact_evm_payload_authorization_valid_before`   | verify    | Authorization expired                                                                                                 |
| `invalid_exact_evm_payload_authorization_value_mismatch` | verify    | Authorized amount below required                                                                                      |
| `invalid_exact_evm_payload_recipient_mismatch`           | verify    | `authorization.to` / `witness.to` does not match `payTo`                                                              |
| `invalid_network`                                        | verify    | Network not supported                                                                                                 |
| `invalid_payload`                                        | verify    | Payload malformed or internal field mismatch                                                                          |
| `invalid_payment_requirements`                           | verify    | Payment requirements structurally invalid                                                                             |
| `invalid_scheme`                                         | both      | `scheme` is neither `"exact"` nor `"upto"`                                                                            |
| `unsupported_scheme`                                     | —         | Reserved per x402 v2 spec §9; not currently emitted by b402 (we use `invalid_scheme` for scheme-validation failures). |
| `invalid_x402_version`                                   | both      | `x402Version` is not `2`                                                                                              |
| `invalid_transaction_state`                              | settle    | On-chain revert or confirmation timeout                                                                               |
| `unexpected_verify_error`                                | verify    | Internal verify error (unmapped)                                                                                      |
| `unexpected_settle_error`                                | settle    | Internal settle error (e.g. RPC failure, unmapped)                                                                    |

### Deviations from x402 v2 spec

B402 V2 aligns with the
[x402 v2 public spec](https://github.com/coinbase/x402/blob/main/specs/x402-specification-v2.md) on
wire format. The following are **deliberate b402 extensions** — they are not spec violations; they
occupy slots the spec explicitly reserves for implementations, or add functionality the spec doesn't
yet cover.

| Deviation                                                        | Rationale                                                                                                                                                                                                                       |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /supported` (spec uses `GET`)                              | The Binance Open API gateway signs every request body with merchant RSA; a body-less `GET` would require reworking the auth model. `POST` with empty JSON `{}` preserves the gateway's signing pattern.                         |
| `"upto"` scheme                                                  | Spec only defines `"exact"`. B402 adds `"upto"` for pay-as-you-go flows where the buyer authorises a cap and the merchant charges an actual amount ≤ cap.                                                                       |
| `assetTransferMethod`: `"permit2-exact"` / `"permit2-upto"`      | Spec only describes EIP-3009 for `"exact"`. B402 adds Permit2-based methods (mainstream ERC-20 pattern) via the inline `extra.assetTransferMethod` selector.                                                                    |
| `settleAmount` field on `/settle` request                        | Required for `permit2-upto`: buyer signs an authorised cap; the merchant specifies the actual settled amount at `/settle` time. Ignored for other methods. Not present in spec.                                                 |
| `extra.assetTransferMethod` / `signerAddress` / `spenderAddress` | B402-specific fields inside the spec-reserved `extra` slot (spec: _"Scheme-specific additional information"_). Replaces V1's overloaded `facilitatorAddress` with two explicit fields (EOA signer vs Permit2 spender contract). |

Apart from these, all wire shapes, field names, error codes, and semantics follow the x402 v2 spec.
Merchants can write integration code against the public spec and only the deviations above require
b402-specific handling.

### Note on `settleAmount` for `permit2-upto`

The x402 v2 spec (§7.2) describes the `upto` scheme as reusing `paymentRequirements.amount` to mean
_"maximum authorized amount at verification time, but the actual amount to settle at settlement
time"_ — i.e., the merchant re-submits `paymentRequirements` at `/settle` with `amount` mutated to
the actual charge.

B402 uses a dedicated **`settleAmount`** field on the `/settle` request instead. Rationale: keeps
`paymentRequirements` immutable across the verify → settle flow, which is cleaner for logging,
auditability, and replay protection. Functionally equivalent; just a different encoding choice.

Integrators should:

- Send `paymentRequirements.amount` = the signed cap (same value at both `/verify` and `/settle`)
- Include `settleAmount` on the `/settle` body for `permit2-upto` (must be ≤
  `paymentRequirements.amount`)
- Omit `settleAmount` for `eip3009` / `permit2-exact` (or include it; it's ignored — the full signed
  amount is always transferred)
