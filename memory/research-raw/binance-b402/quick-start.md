# Quick Start

Follow these steps to integrate x402 into your application.

### 1. Apply for an Account

Register as a partner and obtain your API credentials (`clientId` and `accessToken`).
**[Apply here](https://forms.gle/aUQvxUETfGMzyTky5).**

See [Apply partner developer account](basics/6.apply-developer-account.md) for the full onboarding
process and required materials.

### 2. Understand the Basics

Before coding, review these foundation documents:

- [Common API request headers](basics/1.common-request-headers.md)
- [Common API response](basics/2.common-response.md)
- [API request signing](basics/3.request-signing.md)
- [Environments and API base URLs](basics/4.base-urls.md)

### 3. Query Supported Configurations

Call **POST** `{BASE_URL}/papi/v2/b402/supported` to retrieve the supported payment kinds, networks,
tokens, and signer addresses.

Cache the response — this data changes infrequently and should be refreshed periodically rather than
on every request.

See [Get Supported Configurations (V2)](open-apis-v2/1.get-supported-configurations.md).

#### Your first signed request

Once you have your `clientId`, `accessToken`, and Base64 PKCS#8 private key, the snippet below makes
a signed `/supported` call end-to-end. Substitute `{BASE_URL}` with the value provided to you during
onboarding (see [basics/4.base-urls.md](basics/4.base-urls.md)). `PRIV_KEY_B64` is the contents of
`private_key.base64` produced in [API request signing — Step 1](basics/3.request-signing.md).

```python
# Dep: pip install pycryptodome
import base64, json, time, urllib.request
from Crypto.PublicKey import RSA
from Crypto.Signature import pkcs1_15
from Crypto.Hash import SHA256

BASE_URL = "<your base URL — see basics/4.base-urls.md>"
CLIENT_ID = "<your client id>"
ACCESS_TOKEN = "<your access token>"
PRIV_KEY_B64 = "<your Base64 PKCS#8 private key, one line>"

body = "{}"
timestamp = str(int(time.time() * 1000))
to_sign = (body + timestamp).encode("utf-8")

priv = RSA.import_key(base64.b64decode(PRIV_KEY_B64))
signature = base64.b64encode(
    pkcs1_15.new(priv).sign(SHA256.new(to_sign))
).decode()

req = urllib.request.Request(
    f"{BASE_URL}/papi/v2/b402/supported",
    data=body.encode(),
    method="POST",
    headers={
        "Content-Type": "application/json",
        "X-Tesla-ClientId": CLIENT_ID,
        "X-Tesla-SignAccessToken": ACCESS_TOKEN,
        "X-Tesla-Timestamp": timestamp,
        "X-Tesla-Signature": signature,
    },
)
with urllib.request.urlopen(req) as r:
    print(r.status, json.dumps(json.loads(r.read()), indent=2))
```

A successful call returns `200` and a JSON body with `kinds`, `extensions`, and `signers` —
confirming your signing flow works end-to-end.

### 4. Return HTTP 402 to Buyers

When a client requests a paid resource, respond with HTTP **402 Payment Required** and include
payment requirements in the response. Use the data from `/supported` to populate the
`X-PAYMENT-REQUIREMENTS` header with the accepted token, network, amount, and recipient address.

> ⚠️ **Echo the full `extra` object from `/supported` verbatim.** Your 402 response must copy the
> entire `kinds[].extra` object into `paymentRequirements.extra` — `name`, `version`,
> `assetTransferMethod`, `signerAddress`, and (for `permit2-*`) `spenderAddress`. Buyers do not have
> access to `/supported` — they rely entirely on what you send in the 402 response to build the
> EIP-712 typed-data domain and a valid Permit2 signature. See
> [Forwarding Addresses to Buyers (V2)](open-apis-v2/1.get-supported-configurations.md#forwarding-addresses-to-buyers-merchant-responsibility).

### 5. Verify Payment

When a client resubmits the request with a signed payment payload, call **POST**
`{BASE_URL}/papi/v2/b402/verify` to validate the buyer's EIP-712 signature off-chain before
proceeding to submission.

See [Verify Payment (V2)](open-apis-v2/2.verify-payment.md).

### 6. Submit Payment

If verification passes, call **POST** `{BASE_URL}/papi/v2/b402/settle` to execute the on-chain token
transfer. Gas is sponsored — funds move directly from the buyer's wallet to your wallet.

See [Settle Payment (V2)](open-apis-v2/3.settle-payment.md).

---

> **Note:** It is recommended to start with the **Sandbox (Testnet)** environment first. Refer to
> [Environments and API base URLs](basics/4.base-urls.md) for Sandbox and Production base URLs.
