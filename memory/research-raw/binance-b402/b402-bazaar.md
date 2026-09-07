# B402 Bazaar

B402 Bazaar is the discovery layer for B402-registered paid endpoints. AI agents (and any other
client) can search the Bazaar to find HTTP APIs and MCP tools that accept x402 payments — without
anyone pre-configuring a list. As a merchant, you opt your endpoint in by attaching a metadata blob
to your normal V2 settle call. Bazaar indexes you within ~30 seconds of the first confirmed settle
carrying that blob.

> **Status: opt-in and free.** No separate registration, no contract, no back-office signup. You
> declare metadata on your V2 settle, Bazaar picks it up.

> **Coinbase CDP wire-shape compatible.** The blob shape matches
> [CDP's x402 Bazaar extension spec](https://github.com/coinbase/x402/blob/main/specs/extensions/bazaar.md)
> field-for-field. If your code already produces a CDP-compatible bazaar blob (e.g. via
> `@coinbase/x402-fetch` or the Python SDK), the same blob works against B402 — just point at our
> settle endpoint.

### How It Works

```
Your endpoint ─▶ V2 settle (with bazaar blob) ─▶ B402 ─▶ on-chain confirm
                                                            │
                                                            ▼
                                                   Bazaar indexer (30s tick)
                                                            │
                                                            ▼
                                          /bazaar/* (public discovery catalog)
```

1. A buyer (usually an AI agent) calls your paid endpoint with an x402 V2 payment header.
2. You forward the payment to B402's `/papi/v2/b402/settle` with `paymentPayload.extensions.bazaar`
   populated.
3. B402 confirms the on-chain settle and stores the blob.
4. Bazaar's indexer picks up the row on its next 30-second tick and upserts your resource into the
   catalog.
5. Agents searching the Bazaar see your endpoint in the results.

**First appearance:** typically within 30–60 seconds of the first confirmed V2 settle. Failed or
timed-out settles do not count toward indexing.

**Updating metadata:** subsequent settles with a different blob overwrite the stored row's metadata
(keyed on `(merchantId, resourceUrl)`). You can update your `description` or `schema` just by
shipping an updated blob on your next settle.

**Multi-chain:** if you settle the same URL on multiple chains, B402 appends each chain to your
resource's `accepts[]` array rather than overwriting. Agents see all your payment options.

### TL;DR — attach `extensions.bazaar` on every V2 settle

Minimum HTTP-GET example. The `extensions.bazaar` object goes inside the `paymentPayload` you send
to [`/papi/v2/b402/settle`](open-apis-v2/3.settle-payment.md):

```jsonc
{
  "x402Version": 2,
  "paymentPayload": {
    "x402Version": 2,
    "resource": {
      "url": "https://api.example.com/btc-price",
      "description": "Real-time BTC spot price aggregated from 20 exchanges.",
      "mimeType": "application/json",
    },
    "accepted": {
      /* your PaymentRequirements */
    },
    "payload": {
      /* signed authorization */
    },
    "extensions": {
      "bazaar": {
        "info": {
          "input": {
            "type": "http",
            "method": "GET",
            "queryParams": { "symbol": "BTC" },
          },
          "output": {
            "type": "json",
            "example": { "symbol": "BTC", "price": 67000, "ts": 1700000000 },
          },
        },
        "schema": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "input": {
              "type": "object",
              "properties": {
                "type": { "const": "http" },
                "method": { "enum": ["GET"] },
              },
              "required": ["type", "method"],
            },
          },
          "required": ["input"],
        },
        "description": "Real-time BTC spot price aggregated from 20 exchanges.",
      },
    },
  },
  "paymentRequirements": {
    /* same as /verify */
  },
}
```

That's the whole integration. No other endpoints to call, no API keys to rotate.

### The bazaar blob — field reference

| Field           | Required             | Type                               | Purpose                                                                                                                                   |
| --------------- | -------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `info`          | **yes**              | object                             | Discovery payload — describes the resource's input / output. Shape depends on variant (see below).                                        |
| `schema`        | **yes**              | JSON Schema (Draft 2020-12) object | Validates the shape of `info`. Must define `input` (required) and optionally `output`. Invalid blobs are skipped by the indexer.          |
| `routeTemplate` | no                   | string like `/users/:userId`       | For parameterized HTTP routes. Lets B402 collapse `/users/1` and `/users/2` into a single catalog entry. Omit for static routes.          |
| `description`   | no (but recommended) | string                             | Human-readable resource description. Surfaced on the API's resource-level `description` field. If omitted, B402 derives one from the URL. |

### `info` variants

The shape of `info.input` depends on what kind of resource you're listing. The discriminator is
`info.input.type` plus, for HTTP, `info.input.method`.

#### Variant A — HTTP query method (`GET`, `HEAD`, `DELETE`)

```json
{
  "input": {
    "type": "http",
    "method": "GET",
    "queryParams": { "symbol": "BTC" },
    "headers": { "X-Client-Version": "1" }
  },
  "output": {
    "type": "json",
    "example": { "price": 67000 }
  }
}
```

| Sub-field           | Required                  | Notes                                                 |
| ------------------- | ------------------------- | ----------------------------------------------------- |
| `input.type`        | yes                       | Always `"http"`                                       |
| `input.method`      | yes                       | `"GET"`, `"HEAD"`, or `"DELETE"`                      |
| `input.queryParams` | no                        | Example query params                                  |
| `input.headers`     | no                        | Example headers (agents may use these to shape calls) |
| `output.type`       | yes (if `output` present) | e.g. `"json"`, `"text"`                               |
| `output.example`    | no                        | An example payload the endpoint returns               |

#### Variant B — HTTP body method (`POST`, `PUT`, `PATCH`)

Same as Variant A, plus `input.bodyType` (`"json"` / `"form-data"` / `"text"`) and `input.body`
(example request body — required for body methods).

```json
{
  "input": {
    "type": "http",
    "method": "POST",
    "bodyType": "json",
    "body": { "ticker": "AAPL", "depth": "full" }
  },
  "output": { "type": "json", "example": { "result": "..." } }
}
```

#### Variant C — MCP tool

```json
{
  "input": {
    "type": "mcp",
    "tool": "financial_analysis",
    "description": "Deep-dive financial analysis for a single ticker.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "ticker": { "type": "string" },
        "depth": { "type": "string", "enum": ["summary", "deep"] }
      },
      "required": ["ticker"]
    },
    "example": { "ticker": "AAPL", "depth": "deep" }
  },
  "output": { "type": "json", "example": { "summary": "...", "score": 8.5 } }
}
```

For MCP tools the unique resource identifier is the tuple `(resource.url, info.input.tool)` —
multiple tools on the same URL produce distinct listings.

### `routeTemplate` — parameterized routes

If your endpoint has path parameters like `/users/123` and `/users/456`, set `routeTemplate` so
Bazaar collapses them into a single catalog entry:

```jsonc
{
  "info": { "input": { "type": "http", "method": "GET", "pathParams": { "userId": "123" } } },
  "schema": {
    /* ... */
  },
  "routeTemplate": "/users/:userId",
}
```

Rules (per CDP spec): must start with `/`, match `^/[a-zA-Z0-9_/:.\-~%]+$`, no `..`, no `://`.
Static routes must omit `routeTemplate`.

### Example: TypeScript

```ts
const PRICE_FEED_BLOB = {
  info: {
    input: {
      type: "http" as const,
      method: "GET" as const,
      queryParams: { symbol: "BTC" },
    },
    output: {
      type: "json" as const,
      example: { symbol: "BTC", price: 67000 },
    },
  },
  schema: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    properties: {
      input: {
        type: "object",
        properties: {
          type: { const: "http" },
          method: { enum: ["GET"] },
        },
        required: ["type", "method"],
      },
    },
    required: ["input"],
  },
  description: "Real-time BTC spot price aggregated from 20 exchanges.",
};

// When building the V2 payment payload for /papi/v2/b402/settle:
const paymentPayload = {
  x402Version: 2,
  resource: {
    url: "https://api.example.com/btc-price",
    description: PRICE_FEED_BLOB.description,
    mimeType: "application/json",
  },
  accepted: paymentRequirements,
  payload: { signature, authorization },
  extensions: { bazaar: PRICE_FEED_BLOB },
};
```

### Example: Python

```python
PRICE_FEED_BLOB = {
    "info": {
        "input": {
            "type": "http",
            "method": "GET",
            "queryParams": {"symbol": "BTC"},
        },
        "output": {"type": "json", "example": {"symbol": "BTC", "price": 67000}},
    },
    "schema": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
            "input": {
                "type": "object",
                "properties": {
                    "type":   {"const": "http"},
                    "method": {"enum": ["GET"]},
                },
                "required": ["type", "method"],
            }
        },
        "required": ["input"],
    },
    "description": "Real-time BTC spot price aggregated from 20 exchanges.",
}

payment_payload = {
    "x402Version": 2,
    "resource": {
        "url": "https://api.example.com/btc-price",
        "description": PRICE_FEED_BLOB["description"],
        "mimeType": "application/json",
    },
    "accepted": payment_requirements,
    "payload": {"signature": signature, "authorization": authorization},
    "extensions": {"bazaar": PRICE_FEED_BLOB},
}
```

### Verifying your listing

After your first confirmed V2 settle with the blob, hit any of the discovery endpoints. **No
authentication required** — discovery is public read-only. Production base URL is
`https://www.binance.com/bapi/ramp/v1/public/ramp/b402`; see
[Environments and API base URLs](basics/4.base-urls.md) for sandbox.

```bash
# Paginated catalog (response data key: items[])
curl https://www.binance.com/bapi/ramp/v1/public/ramp/b402/bazaar/resources

# Your listings only (response data key: resources[])
curl "https://www.binance.com/bapi/ramp/v1/public/ramp/b402/bazaar/merchant?payTo=<your-payTo-address>"

# Keyword search (response data key: resources[])
curl "https://www.binance.com/bapi/ramp/v1/public/ramp/b402/bazaar/search?query=BTC+price"
```

A response wraps the CDP-shape catalog in Binance's standard BAPI envelope — the discovery payload
is in `data`:

```jsonc
{
  "code": "000000",
  "message": null,
  "messageDetail": null,
  "data": {
    "items": [
      {
        "resource": "https://api.example.com/btc-price",
        "type": "http",
        "x402Version": 2,
        "description": "Real-time BTC spot price aggregated from 20 exchanges.",
        "accepts": [
          {
            "scheme": "permit2-exact",
            "network": "eip155:56",
            "asset": "0x55d398326f99059fF775485246999027B3197955",
            "maxAmountRequired": "1000",
            "payTo": "0xabc...",
          },
        ],
        "lastUpdated": 1780476191702,
        "quality": {
          "l30DaysTotalCalls": 1543,
          "l30DaysUniquePayers": 87,
          "lastCalledAt": 1780476131000,
        },
      },
    ],
    "pagination": { "limit": 25, "offset": 0, "total": 1 },
    "x402Version": 2,
  },
  "success": true,
}
```

#### Discovery endpoint reference

| Endpoint            | Method | Query parameters                                                       | Default / max `limit` | `data` array key |
| ------------------- | ------ | ---------------------------------------------------------------------- | --------------------- | ---------------- |
| `/bazaar/resources` | GET    | `limit`, `offset`                                                      | 25 / 100              | `items[]`        |
| `/bazaar/merchant`  | GET    | **`payTo`** (required, 0x-prefixed EVM address), `limit`, `offset`     | 25 / 100              | `resources[]`    |
| `/bazaar/search`    | GET    | `query`, `network`, `asset`, `scheme`, `payTo`, `maxUsdPrice`, `limit` | 20 / 20 (no `offset`) | `resources[]`    |

`/search` filter notes:

- `query` — free-text search over resource description and synthesized name; max 400 chars.
- `network` / `asset` / `scheme` / `payTo` — narrow to a specific payment option; max 200 chars
  each.
- `maxUsdPrice` — filter to resources whose primary `accepts[]` entry charges at most this many USD
  per call. Decimal string.
- Search has no `offset`/cursor pagination — refine the query with the filters above to surface more
  results.

### How agents find you

AI agents integrate with Bazaar in one of two ways:

1. **REST.** The agent queries `/bazaar/search` directly and picks resources from the result.
2. **MCP.** The agent uses the `search_resources` tool on Bazaar's hosted MCP endpoint. This is the
   path for agents built on Claude Desktop, OpenAI function-calling frameworks, and similar.

Once they've found your resource, they invoke it through their existing x402 client stack. Bazaar
doesn't proxy the call — it's pure discovery.

### Ranking & visibility

Discovery results are ranked by a composite score combining four signals:

- **Text relevance** — your `description` and synthesized internal name are matched against the
  agent's search query.
- **Recent activity** — resources that haven't seen a settle in 30 days sink in the rankings.
- **Buyer diversity** — a resource with 1,000 settles from 3 wallets ranks below one with 500
  settles from 200 wallets.
- **Fail rate** — resources whose recent settles frequently fail are demoted; resources with
  `fail_rate_24h > 50%` are filtered from results entirely.

A minimum-amount threshold (USD $0.01-equivalent per settle) filters out micro-settles from the
activity signal, and the diversity cap weights buyers more than raw settle count. Together these
mean it's more expensive to fake activity than to build a genuinely-useful endpoint.

### FAQ

**Do I have to opt in on every settle, or once is enough?** Every V2 settle. Bazaar treats the blob
as "re-advertise my listing with this metadata." It's cheap on your side (it rides on an
already-happening request), and lets you update metadata without a side-channel.

**What if I have more than one endpoint?** Send a different blob for each endpoint's settles. Each
`(payTo, resourceUrl)` pair is a separate listing.

**Can I support multiple chains on the same URL?** Yes — settle on each chain separately with the
same `resource.url`. B402 merges the `accepts[]` array so agents see all your chains on the same
resource. Dedup key is `(scheme, network, asset)` — the latest settle on a given tuple overwrites
that entry.

**What if the same endpoint has multiple pricing tiers (e.g. basic / pro)?** Bazaar treats them as
one listing per `(merchantId, resourceUrl)` — the last settle's `maxAmountRequired` wins for that
`(network, asset, scheme)` entry. Multi-tier listings are on the roadmap.

**Can I submit a listing without settling?** Not in v0 — listing is strictly opt-in via successful
V2 settle. Marketing-only listings are deferred to a future version.

**How do I get removed?** Stop including the blob on new settles and your listing's recency signal
will decay until it sinks below the visible results. For an active takedown (e.g. leaked API key,
compromised endpoint), reach out via the [application form](https://forms.gle/aUQvxUETfGMzyTky5) and
we'll hide the listing.

### Next Steps

- [Settle Payment (V2)](open-apis-v2/3.settle-payment.md) — the wire shape that carries the bazaar
  blob.
- [Environments and API base URLs](basics/4.base-urls.md) — where to call settle, and the public
  Bazaar discovery base URL.
- [Integration Guideline](integration-guideline.md) — prerequisites, checklist, and best practices
  for B402 generally.
