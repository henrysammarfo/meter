# Get Supported Configurations (V2)

```
POST /papi/v2/b402/supported
```

Returns all payment kinds, extensions, and facilitator signer addresses supported by B402,
conforming to the
[x402 v2 specification](https://github.com/coinbase/x402/blob/main/specs/x402-specification-v2.md).

> **Differences from V1**
> ([`/papi/v1/b402/supported`](../open-apis/1.get-supported-configurations.md)):
>
> | V1                                                                                           | V2                                                                                                      |
> | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
> | `kinds[].x402Version: 1`                                                                     | `kinds[].x402Version: 2`                                                                                |
> | `kinds[].scheme: "exact"` for all methods                                                    | `"exact"` for `eip3009` / `permit2-exact`, `"upto"` for `permit2-upto`                                  |
> | `kinds[].extra.facilitatorAddress` (overloaded: EOA for eip3009, proxy contract for permit2) | **removed.** Replaced by `extra.signerAddress` (EOA) + `extra.spenderAddress` (proxy, null for eip3009) |
> | `signers` keys per-chain (`"eip155:56"`)                                                     | `signers` keys are CAIP-2 wildcard namespaces (`"eip155:*"`)                                            |

### Request Body

No request body required. Send empty JSON `{}` or omit the body entirely.

#### Example

```json
{}
```

```shell
curl -X POST https://{domain}/papi/v2/b402/supported \
-H 'Content-Type: application/json' \
-H 'X-Tesla-ClientId: {your client id}' \
-H 'X-Tesla-SignAccessToken: {your access token}' \
-H 'X-Tesla-Timestamp: {now}' \
-H 'X-Tesla-Signature: {signature}' \
-d '{}'
```

### Response Body

| **Field**                         | **Type** | **Remarks**                                                                                     |
| --------------------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| kinds                             | array    | List of supported payment kinds                                                                 |
| kinds[].x402Version               | integer  | x402 protocol version (always `2`)                                                              |
| kinds[].scheme                    | string   | `"exact"` for `eip3009` / `permit2-exact`; `"upto"` for `permit2-upto`                          |
| kinds[].network                   | string   | CAIP-2 network identifier (e.g. `"eip155:56"`)                                                  |
| kinds[].extra                     | object   | Scheme-specific details                                                                         |
| kinds[].extra.name                | string   | EIP-712 domain name of the token (e.g. `"U"`, `"USD1"`, `"USD Coin"`, `"Tether USD"`)           |
| kinds[].extra.version             | string   | EIP-712 domain version of the token contract                                                    |
| kinds[].extra.assetTransferMethod | string   | `"eip3009"`, `"permit2-exact"`, or `"permit2-upto"` (b402 inline extension)                     |
| kinds[].extra.signerAddress       | string   | Facilitator EOA that signs on-chain transactions. Present for all methods.                      |
| kinds[].extra.spenderAddress      | string   | Spender contract (Permit2 proxy) address. **Null for `eip3009`**; required for permit2 signing. |
| extensions                        | array    | Supported x402 extensions (currently empty `[]`)                                                |
| signers                           | map      | CAIP-2 wildcard namespace → list of Facilitator signer (EOA) addresses                          |

#### Example

```json
{
  "code": "000000",
  "message": "success",
  "data": {
    "kinds": [
      {
        "x402Version": 2,
        "scheme": "exact",
        "network": "eip155:56",
        "extra": {
          "name": "U",
          "version": "1",
          "assetTransferMethod": "eip3009",
          "signerAddress": "0x1111111111111111111111111111111111111111"
        }
      },
      {
        "x402Version": 2,
        "scheme": "exact",
        "network": "eip155:56",
        "extra": {
          "name": "U",
          "version": "1",
          "assetTransferMethod": "permit2-exact",
          "signerAddress": "0x1111111111111111111111111111111111111111",
          "spenderAddress": "0x2222222222222222222222222222222222222222"
        }
      },
      {
        "x402Version": 2,
        "scheme": "upto",
        "network": "eip155:56",
        "extra": {
          "name": "U",
          "version": "1",
          "assetTransferMethod": "permit2-upto",
          "signerAddress": "0x1111111111111111111111111111111111111111",
          "spenderAddress": "0x3333333333333333333333333333333333333333"
        }
      },
      {
        "x402Version": 2,
        "scheme": "exact",
        "network": "eip155:56",
        "extra": {
          "name": "USD1",
          "version": "1",
          "assetTransferMethod": "eip3009",
          "signerAddress": "0x1111111111111111111111111111111111111111"
        }
      },
      {
        "x402Version": 2,
        "scheme": "exact",
        "network": "eip155:56",
        "extra": {
          "name": "USD1",
          "version": "1",
          "assetTransferMethod": "permit2-exact",
          "signerAddress": "0x1111111111111111111111111111111111111111",
          "spenderAddress": "0x2222222222222222222222222222222222222222"
        }
      },
      {
        "x402Version": 2,
        "scheme": "upto",
        "network": "eip155:56",
        "extra": {
          "name": "USD1",
          "version": "1",
          "assetTransferMethod": "permit2-upto",
          "signerAddress": "0x1111111111111111111111111111111111111111",
          "spenderAddress": "0x3333333333333333333333333333333333333333"
        }
      },
      {
        "x402Version": 2,
        "scheme": "exact",
        "network": "eip155:56",
        "extra": {
          "name": "Tether USD",
          "version": "1",
          "assetTransferMethod": "permit2-exact",
          "signerAddress": "0x1111111111111111111111111111111111111111",
          "spenderAddress": "0x2222222222222222222222222222222222222222"
        }
      },
      {
        "x402Version": 2,
        "scheme": "upto",
        "network": "eip155:56",
        "extra": {
          "name": "Tether USD",
          "version": "1",
          "assetTransferMethod": "permit2-upto",
          "signerAddress": "0x1111111111111111111111111111111111111111",
          "spenderAddress": "0x3333333333333333333333333333333333333333"
        }
      },
      {
        "x402Version": 2,
        "scheme": "exact",
        "network": "eip155:56",
        "extra": {
          "name": "USD Coin",
          "version": "2",
          "assetTransferMethod": "permit2-exact",
          "signerAddress": "0x1111111111111111111111111111111111111111",
          "spenderAddress": "0x2222222222222222222222222222222222222222"
        }
      },
      {
        "x402Version": 2,
        "scheme": "upto",
        "network": "eip155:56",
        "extra": {
          "name": "USD Coin",
          "version": "2",
          "assetTransferMethod": "permit2-upto",
          "signerAddress": "0x1111111111111111111111111111111111111111",
          "spenderAddress": "0x3333333333333333333333333333333333333333"
        }
      }
    ],
    "extensions": [],
    "signers": {
      "eip155:*": ["0x1111111111111111111111111111111111111111"]
    }
  }
}
```

> **Notes:**
>
> - The response changes infrequently. It is safe to cache the result and refresh periodically (e.g.
>   once per hour).
> - `signerAddress` is the Facilitator externally-owned account (EOA) — the wallet that submits
>   on-chain transactions and pays gas. Use it to recover/verify transaction origin.
> - `spenderAddress` is the Permit2 proxy contract that the buyer authorises in their Permit2
>   signature (`permit2Authorization.spender`). It is absent (`null`, omitted from JSON) for
>   `eip3009` because EIP-3009 transfers are submitted directly against the token contract without a
>   proxy.
> - For `permit2-upto`, `scheme` is `"upto"` per the x402 v2 spec — the authorised amount is an
>   upper bound, and the actual settled amount is specified at `/settle` time via `settleAmount`.
> - `signers` keys use the CAIP-2 wildcard namespace (e.g. `"eip155:*"`) rather than per-chain
>   identifiers, matching the x402 v2 reference implementation. A single Facilitator EOA signs
>   across all EVM chains in this namespace.

### Forwarding Addresses to Buyers (Merchant Responsibility)

> ⚠️ **Required:** The merchant MUST forward `signerAddress` and `spenderAddress` from the
> `/supported` response into the `paymentRequirements.extra` object of the HTTP
> `402 Payment Required` response returned to buyers. Buyers rely on these fields to construct a
> valid Permit2 signature — **they cannot, and should not, call `/supported` themselves** (the
> endpoint is gated by merchant credentials and is not part of the buyer-facing surface).

Per the x402 protocol, buyers never talk to B402 directly; the only channel between buyer and
facilitator is the merchant's 402 response. If these fields are missing from the 402 body, the buyer
has no way to know:

- Which contract to set as `permit2Authorization.spender` when signing (← `spenderAddress`).
- Which address to bind in `witness.facilitator` for `permit2-upto` signatures (← `signerAddress`).

Omitting them will cause buyer-side signing to fail, or produce signatures that B402 rejects at
`/verify` with `invalid_payload`.

#### Field mapping: `/supported` response → merchant 402 response

| From `/supported` response          | Must appear in merchant's 402 response as       | Required for                                                                          |
| ----------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| `kinds[].extra.signerAddress`       | `paymentRequirements.extra.signerAddress`       | All methods. Buyers bind it into `witness.facilitator` for `permit2-upto` signatures. |
| `kinds[].extra.spenderAddress`      | `paymentRequirements.extra.spenderAddress`      | `permit2-exact` and `permit2-upto`. Omit (or set to `null`) for `eip3009`.            |
| `kinds[].extra.name`                | `paymentRequirements.extra.name`                | All methods — EIP-712 domain name used by buyer when building the typed data.         |
| `kinds[].extra.version`             | `paymentRequirements.extra.version`             | All methods — EIP-712 domain version used by buyer when building the typed data.      |
| `kinds[].extra.assetTransferMethod` | `paymentRequirements.extra.assetTransferMethod` | All methods — selects which signing scheme the buyer must use.                        |

#### Example — merchant 402 response body (permit2-upto)

```json
HTTP/1.1 402 Payment Required
Content-Type: application/json

{
  "x402Version": 2,
  "accepts": [
    {
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
  ]
}
```

> **Implementation tip:** Cache the `/supported` response on the merchant side (see note above) and
> copy `signerAddress` / `spenderAddress` / `name` / `version` / `assetTransferMethod` from the
> matching `kinds[]` entry into every 402 response you emit. Do **not** hardcode these addresses —
> they may change when B402 upgrades Permit2 proxies, and `/supported` is the single source of
> truth.
