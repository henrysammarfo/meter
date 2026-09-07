# Settle Payment (V2)

```
POST /papi/v2/b402/settle
```

Executes on-chain settlement — submits the payment transaction to BNB Smart Chain. **This operation
is irreversible.** Always call `/verify` first to validate the payment. Gas is sponsored; the
merchant does not need to hold BNB for gas fees.

> **Differences from V1** ([`/papi/v1/b402/settle`](../open-apis/3.settle-payment.md)):
>
> | V1                                                                      | V2                                                                                                                                              |
> | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
> | Request uses V1 `paymentPayload` shape (top-level `scheme` / `network`) | Request uses V2 `paymentPayload` shape (flattened, with `accepted` + `resource`). Same as [`/verify`](2.verify-payment.md).                     |
> | Response includes `confirmations`, `errorMessage`                       | `confirmations` removed from wire (retained in server logs only); `errorMessage` populated only for the structural-error code `invalid_payload` |
> | `errorReason` values from V1 internal enums                             | `errorReason` uses x402 v2 standard codes                                                                                                       |
> | `transaction` absent on failure without tx hash                         | `transaction` always present (empty string `""` when no tx was broadcast, per x402 v2 spec)                                                     |

### Request Body

Same structure as [`/verify`](2.verify-payment.md) request, plus `settleAmount`.

| **Field**           | **Type** | **Mandatory**           | **Remarks**                                                                                                                                     |
| ------------------- | -------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| x402Version         | integer  | Yes                     | Must be `2`. Any other value → `invalid_x402_version`.                                                                                          |
| paymentPayload      | object   | Yes                     | Same structure as `/verify` request. See [Verify Payment](2.verify-payment.md) for full field descriptions.                                     |
| paymentRequirements | object   | Yes                     | Same structure as `/verify` request. See [Verify Payment](2.verify-payment.md) for full field descriptions.                                     |
| settleAmount        | string   | Only for `permit2-upto` | The actual amount to settle, in the token's atomic units. Must be ≤ the authorised amount. **Ignored for `eip3009` and `permit2-exact` modes.** |

#### Example — EIP-3009 Settle

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

#### Example — Permit2 Upto Settle (with `settleAmount`)

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
  },
  "settleAmount": "3000000"
}
```

> In this example, the buyer authorised up to 100 USDT (`"100000000"`) but the merchant only charges
> 3 USDT (`"3000000"`) for this request.

### Response Body

| **Field**    | **Type** | **Presence**                               | **Remarks**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------ | -------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| success      | boolean  | Always                                     | Whether the settlement succeeded                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| transaction  | string   | Always                                     | On-chain transaction hash (0x-prefixed, 32-byte hex). **Empty string `""` if no transaction was broadcast** (per x402 v2 spec).                                                                                                                                                                                                                                                                                                                                                                                                       |
| payer        | string   | Always                                     | Payer wallet address                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| network      | string   | Always                                     | Settlement network in CAIP-2 format (e.g. `"eip155:56"`). Empty string `""` if unavailable on pre-broadcast failure.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| amount       | string   | When `success=true`                        | Actual settled amount in atomic units. For `permit2-upto`, equals the requested `settleAmount`; for other methods, equals the full signed amount.                                                                                                                                                                                                                                                                                                                                                                                     |
| errorReason  | string   | On `success=false` (see note)              | x402 v2 standard error code. See [Verify Payment — `invalidReason` / `errorReason` Values](2.verify-payment.md#invalidreason--errorreason-values). ⚠️ Presence alone does **not** mean terminal failure: `invalid_transaction_state` **with a non-empty `transaction`** is indistinguishable between a confirmed on-chain revert (terminal) and a still-pending confirmation timeout — use the **`transaction`** field to tell Pending from terminal Failed. See [Settlement outcomes and polling](#settlement-outcomes-and-polling). |
| errorMessage | string   | Only when `errorReason == invalid_payload` | Human-readable debug context. Populated only for the structural-error code `invalid_payload`. Absent for all other codes (including on-chain reverts mapped to `invalid_transaction_state`).                                                                                                                                                                                                                                                                                                                                          |
| extensions   | object   | No                                         | Reserved for x402 v2 response extensions. Currently absent. (Request-side `paymentPayload.extensions.bazaar` is consumed by [B402 Bazaar](../b402-bazaar.md) for discovery.)                                                                                                                                                                                                                                                                                                                                                          |

> V1's `confirmations` field has been removed from the V2 wire. `errorMessage` is populated only
> when `errorReason == invalid_payload` (request shape malformed); for all other codes — including
> on-chain reverts (`invalid_transaction_state`) — `errorMessage` is absent and debug context is
> retained in server logs only.

### Settlement outcomes and polling

Settlement is processed **asynchronously**. `/settle` broadcasts the transaction and returns as soon
as it either confirms within a short synchronous window or is left awaiting on-chain confirmation —
it does **not** block until final confirmation. Every response is HTTP `200`; inspect `data` to
determine which of three outcomes you received:

| Outcome                      | `success` | `transaction`         | `errorReason`                             | What to do                                                                                                                                                                                                                  |
| ---------------------------- | --------- | --------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Settled** (terminal)       | `true`    | tx hash               | absent                                    | Done — payment settled.                                                                                                                                                                                                     |
| **Failed** (terminal)        | `false`   | **`""`** (empty)      | present                                   | Done — payment failed **before broadcast** (validation / RPC-node error); see `errorReason`.                                                                                                                                |
| **Broadcast — keep polling** | `false`   | **non-empty** tx hash | absent **or** `invalid_transaction_state` | Broadcast; either awaiting confirmation **or** an already-final revert — **indistinguishable on V2**. Re-call `/settle` (idempotent) until `success: true`, or until your extended deadline elapses (then treat as failed). |

> **How to classify a V2 response.** On V2 `errorReason` alone cannot separate a terminal on-chain
> revert from a still-pending confirmation timeout — both surface as `invalid_transaction_state`
> with a transaction hash. The reliable discriminator is the **`transaction`** field:
>
> - `transaction: ""` (empty) → never broadcast → **terminal Failed** (read `errorReason`).
> - `transaction`: a non-empty hash → **broadcast** → **keep polling** until it settles or your
>   deadline elapses. (If you must know revert-vs-pending immediately, use the V1 API — its granular
>   `errorReason` distinguishes `settle_exact_failed_onchain` from `..._timed_out` — or check the tx
>   hash on-chain.)

> ⚠️ **You must handle the Pending outcome — do not stop at the first `success: false`.** A
> `success: false` carrying a **non-empty** `transaction` hash means the payment was broadcast and
> may still confirm (or may already be a final revert — the two are indistinguishable on V2); keep
> polling. Only a `success: false` with `transaction: ""` is a guaranteed terminal failure.
>
> - **Poll** `/settle` (it is idempotent — no double-charge, no re-broadcast) at ~3–5 s cadence
>   until you receive `success: true` (settled) or your deadline elapses.
> - **Poll for at least `maxTimeoutSeconds`, and preferably longer.** `maxTimeoutSeconds` is the
>   buyer's **authorization** validity budget (how long the signature stays valid), **not** a
>   settlement SLA: the backend confirmation job keeps reconciling a broadcast-but-unconfirmed
>   transaction for up to ~30 minutes, so a transaction can still finalize **after**
>   `maxTimeoutSeconds`. Stopping exactly at `maxTimeoutSeconds` risks missing a late confirmation
>   and booking a settled payment as failed.
> - **Never key settlement success on the HTTP status** — it is always `200`.

#### Example — Successful Settlement

```json
{
  "code": "000000",
  "message": "success",
  "data": {
    "success": true,
    "transaction": "0x89c91c789e57059b17285e7ba1716a1f5ff4c5dace0ea5a5135f26158d0421b9",
    "payer": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "network": "eip155:56",
    "amount": "1000000"
  }
}
```

#### Example — Failed Settlement (on-chain revert)

```json
{
  "code": "000000",
  "message": "success",
  "data": {
    "success": false,
    "transaction": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "payer": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "errorReason": "invalid_transaction_state"
  }
}
```

> ⚠️ This exact wire shape (`success: false` + non-empty `transaction` +
> `invalid_transaction_state`) is **also** what a still-pending confirmation timeout returns — on V2
> the two are indistinguishable. Do **not** conclude "failed" from a single such response: keep
> polling `/settle` until `success: true` or your extended deadline (see
> [Settlement outcomes and polling](#settlement-outcomes-and-polling)).

#### Example — Failed Settlement (no transaction broadcast, e.g. pre-flight rejection)

```json
{
  "code": "000000",
  "message": "success",
  "data": {
    "success": false,
    "transaction": "",
    "payer": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "errorReason": "invalid_exact_evm_payload_signature"
  }
}
```

#### Example — Pending Settlement (broadcast, awaiting confirmation)

```json
{
  "code": "000000",
  "message": "success",
  "data": {
    "success": false,
    "transaction": "0x89c91c789e57059b17285e7ba1716a1f5ff4c5dace0ea5a5135f26158d0421b9",
    "payer": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "network": "eip155:56"
  }
}
```

> A `success: false` carrying a **non-empty** `transaction` hash (with or without
> `errorReason: invalid_transaction_state`) means the payment was broadcast and is not yet a
> guaranteed terminal failure. Re-call `/settle` (idempotent) until `success: true`, or until your
> deadline elapses. Only `transaction: ""` is a guaranteed terminal failure. See
> [Settlement outcomes and polling](#settlement-outcomes-and-polling).

> **Notes:**
>
> - **An on-chain failure** (e.g., nonce already used, token revert) still returns HTTP `200` with
>   `code: "000000"`. Check the `success` field in `data` for the settlement outcome.
> - **Irreversible operation.** Once a settlement transaction is broadcast and confirmed on-chain,
>   it cannot be reversed.
> - **Idempotent.** A given `(nonce, network, payer)` tuple can only be settled once. Duplicate
>   calls return the cached result without re-broadcasting.
> - **`settleAmount` behavior by mode:**
>   - `eip3009` / `permit2-exact` — `settleAmount` is ignored; the full signed amount is always
>     transferred.
>   - `permit2-upto` — `settleAmount` is **required** and specifies the actual transfer amount. Must
>     be ≤ `permit2Authorization.permitted.amount`.
> - **Settlement is asynchronous.** `/settle` waits only a short synchronous window (~20 s) for
>   confirmation: a transaction that confirms within it returns `success: true` in a single call;
>   otherwise it returns the **Pending** outcome and you poll `/settle` until it resolves (see
>   [Settlement outcomes and polling](#settlement-outcomes-and-polling)). Most small payments
>   confirm within the window; larger payments or network congestion more often return Pending
>   first.
> - **Rate limit:** 20 requests per second per merchant (`X-Tesla-ClientId`).
> - **All token transfers occur strictly peer-to-peer on the public blockchain** from the buyer's
>   wallet directly to the merchant's wallet. The Facilitator contract validates signatures and
>   forwards the transfer on-chain but never holds tokens in custody.

### `errorReason` Values

See the consolidated
[`invalidReason` / `errorReason` Values](2.verify-payment.md#invalidreason--errorreason-values)
table in the `/verify` page.
