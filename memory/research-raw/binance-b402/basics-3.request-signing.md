# API request signing

Every B402 API request is signed with **RSA-SHA256** using a **1024-bit** RSA key pair you own.

- **One-time setup (Step 1):** generate a key pair and submit the public key during onboarding.
- **Per request (Steps 2–3):** sign the payload `jsonBody + timestamp`, then send the signature plus
  the timestamp in request headers.

The server validates that the timestamp is within **5 minutes** of its current time.

#

### How it works

1. You generate a **1024-bit RSA** key pair and share the public key during onboarding.
2. For each API request, you construct the signing payload: `jsonBody + timestamp`.
3. You sign the payload using **SHA256withRSA** with your private key.
4. The Base64-encoded signature is sent in the `X-Tesla-Signature` header along with the timestamp
   (milliseconds) in the `X-Tesla-Timestamp` header.
5. B402 verifies the signature using your registered public key and validates that the timestamp is
   within 5 minutes of the server time.

#

### Step 1 — Generate your RSA key pair (one-time)

Run the following commands. They leave you with two files: `private_key.base64` (keep private) and
`public_key.base64` (submit during onboarding).

```shell
# 1. Generate a 1024-bit RSA private key (PEM)
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:1024

# 2. Convert the private key to PKCS#8 DER
openssl pkcs8 -topk8 -nocrypt -in private_key.pem -outform DER -out private_key.der

# 3. Base64-encode the DER-encoded private key (single line)
openssl base64 -in private_key.der -out private_key.base64 -A

# 4. Derive the public key in DER form
openssl rsa -in private_key.pem -pubout -outform DER -out public_key.der

# 5. Base64-encode the DER-encoded public key (single line)
openssl base64 -in public_key.der -out public_key.base64 -A
```

> **Note:** Keep `private_key.base64` safe and private — it is used to generate signatures.

> **Note:** Submit `public_key.base64` during onboarding — see
> [Apply partner developer account](6.apply-developer-account.md).

#

### Step 2 — Sign each request

The payload to sign is `jsonBody + timestamp` — the JSON request body concatenated with the
millisecond timestamp string. Encode as UTF-8, sign with SHA256withRSA, then Base64-encode the
signature.

The examples below use `body = "{}"` because that's the body `/supported` accepts. For `/verify` and
`/settle` the body is a full `paymentPayload` JSON — see the
[V2 Open APIs reference](../open-apis-v2/1.get-supported-configurations.md) for the exact shape. The
signing logic is the same either way: whatever bytes you send as the request body, concatenate with
the timestamp and sign.

#### Python

```python
import base64, time
from Crypto.PublicKey import RSA
from Crypto.Signature import pkcs1_15
from Crypto.Hash import SHA256

PRIV_KEY_B64 = "<your Base64 PKCS#8 private key, one line>"

body = "{}"
timestamp = str(int(time.time() * 1000))  # milliseconds
to_sign = (body + timestamp).encode("utf-8")

priv = RSA.import_key(base64.b64decode(PRIV_KEY_B64))
signature = base64.b64encode(
    pkcs1_15.new(priv).sign(SHA256.new(to_sign))
).decode()
```

Dep: `pip install pycryptodome`.

#### Node.js

Uses the built-in `crypto` module — no external dependencies.

```javascript
const crypto = require("crypto");

const PRIV_KEY_B64 = "<your Base64 PKCS#8 private key, one line>";

const body = "{}";
const timestamp = Date.now().toString();
const toSign = body + timestamp;

const privateKey = crypto.createPrivateKey({
  key: Buffer.from(PRIV_KEY_B64, "base64"),
  format: "der",
  type: "pkcs8",
});
const signature = crypto.createSign("SHA256").update(toSign, "utf8").sign(privateKey, "base64");
```

#### Java

```java
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Base64;

String privKeyB64 = "<your Base64 PKCS#8 private key, one line>";
String body = "{}";
String timestamp = String.valueOf(System.currentTimeMillis());
String toSign = body + timestamp;

KeyFactory kf = KeyFactory.getInstance("RSA");
PrivateKey pk = kf.generatePrivate(new PKCS8EncodedKeySpec(Base64.getDecoder().decode(privKeyB64)));
Signature sig = Signature.getInstance("SHA256withRSA");
sig.initSign(pk);
sig.update(toSign.getBytes("UTF-8"));
String signature = Base64.getEncoder().encodeToString(sig.sign());
```

#

### Step 3 — Set the required headers

| Header                    | Value                                                       | Mandatory |
| ------------------------- | ----------------------------------------------------------- | --------- |
| `Content-Type`            | `application/json`                                          | Yes       |
| `X-Tesla-ClientId`        | Your `clientId` (provided by B402 during onboarding)        | Yes       |
| `X-Tesla-SignAccessToken` | Your `accessToken` (provided by B402 during onboarding)     | Yes       |
| `X-Tesla-Signature`       | The Base64 signature produced in Step 2                     | Yes       |
| `X-Tesla-Timestamp`       | The millisecond timestamp you concatenated into the payload | Yes       |

`X-Tesla-Timestamp` **must** equal the exact millisecond value you concatenated into the payload
before signing — the server recomputes `jsonBody + X-Tesla-Timestamp` to verify. The server rejects
requests whose timestamp is more than **5 minutes** off its current time.

#

### Testing with Postman (optional)

#### 1. Environment variables

Create an environment (e.g. `Sandbox`) in Postman with `base_url`, `client_id`, `access_token`,
`private_key`. The `private_key` value should be in PEM form:

```
-----BEGIN PRIVATE KEY-----
MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBANAAMnEOR1NIBIbw
...
-----END PRIVATE KEY-----
```

#### 2. Signing library

Install [postman-util-lib](https://joolfe.github.io/postman-util-lib/). Add a Postman global
variable `pmlib_code` and paste the contents of the
[bundle.js](https://joolfe.github.io/postman-util-lib/dist/bundle.js) as its value.

#### 3. Pre-request script

Add the following to your collection or request:

```javascript
eval(pm.globals.get("pmlib_code"));

pm.request.headers.add({ key: "Content-Type", value: "application/json" });
pm.request.headers.add({ key: "X-Tesla-ClientId", value: pm.environment.get("client_id") });
pm.request.headers.add({
  key: "X-Tesla-SignAccessToken",
  value: pm.environment.get("access_token"),
});

const timestamp = Date.now().toString();
const jsonBody = pm.request.body.raw || "";
const dataToSign = jsonBody + timestamp;

const sha256withRSA = new pmlib.rs.KJUR.crypto.Signature({ alg: "SHA256withRSA" });
sha256withRSA.init(pm.environment.get("private_key"));
sha256withRSA.updateString(dataToSign);
const signature = pmlib.rs.hextob64(sha256withRSA.sign());

pm.request.headers.add({ key: "X-Tesla-Signature", value: signature });
pm.request.headers.add({ key: "X-Tesla-Timestamp", value: timestamp });
```

#

### Troubleshooting

- **Timestamp must be in milliseconds.** A Unix timestamp in seconds will fail signature
  verification. The value in `X-Tesla-Timestamp` must exactly match the one concatenated into the
  payload before signing.
- **`jsonBody` is the exact UTF-8 bytes of the request body.** Serialize your object to a string
  once, then use the same string for both the request body and the signing payload — re-serializing
  (with different key ordering or whitespace) produces a different signature.
- **Private key format.** `PRIV_KEY_B64` must be the Base64 PKCS#8 DER string produced by Step 1
  (`private_key.base64`). Do not include the `-----BEGIN PRIVATE KEY-----` PEM wrapper.
- **5-minute timestamp window.** The server rejects requests whose timestamp is more than 5 minutes
  off its current time. Check your client clock if signed requests fail intermittently.
