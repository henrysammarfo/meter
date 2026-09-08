import { createFileRoute, Link } from "@tanstack/react-router";
import { Terminal, KeyRound, Boxes, CircleAlert } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Docs — Meter an endpoint in 6 lines" },
      {
        name: "description",
        content:
          "Fund a subaccount, answer 402 challenges, settle prepaid or x402, and read shared receipts from the live ledger.",
      },
      { property: "og:title", content: "Docs — Meter an endpoint in 6 lines" },
      {
        property: "og:description",
        content: "HTTP quickstart, 402 challenge shape, invoice payload and limit policy.",
      },
    ],
  }),
  component: DocsPage,
});

const install = `# Keys in .env (gitignored) — server only
TAVILY_API_KEY=...
TINYFISH_API_KEY=...
METER_OPERATOR_KEY=...      # required for fund / invoice mutations in prod
# optional LLM — research path does not require it
AGENTROUTER_API_KEY=...
npm run dev

# Machine-readable surface
GET /api/v1/openapi.json
GET /api/v1/health
GET /api/v1/health?deep=1`;

const middleware = `# Fund sandbox subaccount (operator key when configured)
curl -X POST /api/v1/subaccounts \\
  -H 'content-type: application/json' \\
  -H 'X-Meter-Operator-Key: $METER_OPERATOR_KEY' \\
  -d '{"id":"agent_b7f2","amount":5}'
# Response includes agentToken (shown once) — store it; only the hash is kept server-side

# Paid research (live Tavily + TinyFish)
curl '/api/v1/research?q=bnb+agent+os' \\
  -H 'X-Meter-Agent-Id: agent_b7f2' \\
  -H 'X-Meter-Agent-Token: $AGENT_TOKEN' \\
  -H 'X-Meter-Payment: prepaid'`;

const challenge = `HTTP/1.1 402 Payment Required
PAYMENT-REQUIRED: <base64 PaymentRequired>
X-Meter-Endpoint: /research
X-Meter-Unit: query
X-Meter-Price: 0.02
X-Meter-Settle: prepaid|x402

# Body also includes paymentRequired.accepts[] with scheme + maxAmountRequired`;

const invoice = `# Issue from unbilled receipts
POST /api/v1/invoices
{ "agentId": "agent_b7f2" }

# Example 201 response (fields from live ledger — ids are real)
{
  "id": "inv_…",
  "agentId": "agent_b7f2",
  "amount": 0.02,
  "calls": 1,
  "takeFee": 0.00018,
  "status": "open"
}

# Mark paid
POST /api/v1/invoices/inv_…/pay
Header: X-Meter-Operator-Key`;

const policy = `# Read live utilization
GET /api/v1/limits

{
  "limits": [
    {
      "id": "lm_daily",
      "scope": "workspace",
      "cap": 20,
      "used": 0.02,
      "window": "utc-day",
      "action": "block"
    }
  ]
}

# Cap is enforced server-side on prepaid debit (default $20/UTC day).`;

function Code({ children }: { children: string }) {
  return (
    <pre className="panel overflow-x-auto p-5 font-mono text-xs leading-relaxed text-foreground/85">
      <code>{children}</code>
    </pre>
  );
}

function DocsPage() {
  return (
    <PageShell
      eyebrow="Docs"
      title="Meter an endpoint over HTTP."
      lede="Call /api/v1. Prepaid needs agent id + token; unpaid calls get a 402 Payment Required challenge. OpenAPI is live."
    >
      <p className="mb-8 text-sm">
        <a href="/api/v1/openapi.json" className="text-primary hover:underline">
          OpenAPI JSON →
        </a>
        {" · "}
        <Link to="/demo" className="text-primary hover:underline">
          Live five-beat demo →
        </Link>
        {" · "}
        <Link to="/dashboard/settings" className="text-primary hover:underline">
          Credential vault →
        </Link>
      </p>
      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="panel h-max p-5 lg:sticky lg:top-8">
          <p className="text-xs tracking-widest text-muted-foreground uppercase">On this page</p>
          <nav className="mt-4 flex flex-col gap-3 text-sm">
            <a href="#install" className="text-foreground/75 hover:text-foreground">Install</a>
            <a href="#meter" className="text-foreground/75 hover:text-foreground">Meter a route</a>
            <a href="#challenge" className="text-foreground/75 hover:text-foreground">402 challenge</a>
            <a href="#invoice" className="text-foreground/75 hover:text-foreground">Invoices</a>
            <a href="#limits" className="text-foreground/75 hover:text-foreground">Limit policy</a>
            <a href="#errors" className="text-foreground/75 hover:text-foreground">Failure modes</a>
          </nav>
        </aside>

        <div className="space-y-12">
          <section id="install">
            <h2 className="font-display flex items-center gap-2 text-2xl tracking-tight">
              <Terminal className="h-5 w-5 text-primary" /> Install
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Node 20+. Provider keys stay in server env. Browser vault (Settings) only holds operator/agent tokens for UI mutations.
            </p>
            <div className="mt-4">
              <Code>{install}</Code>
            </div>
          </section>

          <section id="meter">
            <h2 className="font-display flex items-center gap-2 text-2xl tracking-tight">
              <Boxes className="h-5 w-5 text-primary" /> Meter a route
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Units × price is the pricing model. Prepaid debit happens before providers are called; provider failure refunds the debit.
            </p>
            <div className="mt-4">
              <Code>{middleware}</Code>
            </div>
          </section>

          <section id="challenge">
            <h2 className="font-display flex items-center gap-2 text-2xl tracking-tight">
              <KeyRound className="h-5 w-5 text-primary" /> 402 challenge
            </h2>
            <div className="mt-4">
              <Code>{challenge}</Code>
            </div>
          </section>

          <section id="invoice">
            <h2 className="font-display text-2xl tracking-tight">Invoices</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Issued from unbilled receipts on the shared ledger. Both agents see the same invoice id.
            </p>
            <div className="mt-4">
              <Code>{invoice}</Code>
            </div>
          </section>

          <section id="limits">
            <h2 className="font-display text-2xl tracking-tight">Limit policy</h2>
            <div className="mt-4">
              <Code>{policy}</Code>
            </div>
          </section>

          <section id="errors">
            <h2 className="font-display flex items-center gap-2 text-2xl tracking-tight">
              <CircleAlert className="h-5 w-5 text-warning" /> Failure modes
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["LIMIT_WORKSPACE_DAILY / 429", "Workspace daily cap hit. Debit blocked; audited on the ledger."],
                ["INSUFFICIENT_BALANCE / 402", "Prepaid agent balance below call price — quote shows this before convert."],
                ["PAYMENT_REQUIRED / 402", "Missing or invalid prepaid/x402 credentials before research runs."],
                ["UNAUTHORIZED / 401", "Bad operator key or agent token hash mismatch."],
                ["PROVIDER_ERROR", "Tavily/TinyFish failed after debit — prepaid amount is refunded."],
              ].map(([code, desc]) => (
                <div key={code} className="panel p-5">
                  <p className="font-mono text-xs text-warning">{code}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
