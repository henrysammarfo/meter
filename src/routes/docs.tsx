import { createFileRoute } from "@tanstack/react-router";
import { Terminal, KeyRound, Boxes, CircleAlert } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Docs — Meter an endpoint in 6 lines" },
      {
        name: "description",
        content:
          "Install the METER SDK, price a route in units, answer 402 challenges and settle over x402 with batching under the daily cap.",
      },
      { property: "og:title", content: "Docs — Meter an endpoint in 6 lines" },
      {
        property: "og:description",
        content: "SDK quickstart, 402 challenge shape, invoice payload and limit policy.",
      },
    ],
  }),
  component: DocsPage,
});

const install = `# Keys in .env (gitignored)
TAVILY_API_KEY=...
TINYFISH_API_KEY=...
AGENTROUTER_API_KEY=...   # optional LLM; no OpenAI required
npm run dev`;

const middleware = `# Fund sandbox subaccount (withdrawals restricted)
curl -X POST /api/v1/subaccounts \\
  -H 'content-type: application/json' \\
  -d '{"id":"agent_b7f2","amount":5}'

# Paid research (live Tavily + TinyFish)
curl '/api/v1/research?q=bnb+agent+os' \\
  -H 'X-Meter-Agent-Id: agent_b7f2' \\
  -H 'X-Meter-Payment: prepaid'`;

const challenge = `HTTP/1.1 402 Payment Required
PAYMENT-REQUIRED: <base64 PaymentRequired>
X-Meter-Endpoint: /research
X-Meter-Unit: query
X-Meter-Price: 0.02
X-Meter-Settle: x402`;

const invoice = `{
  "id": "INV-2091",
  "from": "agent_a11c",
  "to": "agent_b7f2",
  "lines": [{ "endpoint": "/research", "units": 20627, "unit_price": 0.02 }],
  "total": 412.55,
  "receipt": "0x9f4c...21ab",
  "status": "paid"
}`;

const policy = `meter.limits({
  workspaceDaily: 20,        // x402 default cap
  perAgentDaily: { agent_1c9a: 8 },
  callCeiling: 0.25,
  onExceed: "queue",         // "queue" | "block" | "notify"
});`;

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
      title="Meter an endpoint in six lines."
      lede="The SDK prices the route, answers the 402, settles over x402, and posts the invoice. You write the handler."
    >
      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="panel h-max p-5 lg:sticky lg:top-8">
          <p className="text-xs tracking-widest text-muted-foreground uppercase">On this page</p>
          <nav className="mt-4 flex flex-col gap-3 text-sm">
            <a href="#install" className="text-foreground/75 hover:text-foreground">Install</a>
            <a href="#meter" className="text-foreground/75 hover:text-foreground">Meter a route</a>
            <a href="#challenge" className="text-foreground/75 hover:text-foreground">402 challenge</a>
            <a href="#invoice" className="text-foreground/75 hover:text-foreground">Invoice payload</a>
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
              Node 20+. Bring your Agent OS sub-account key; withdrawals stay restricted in sandbox.
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
              Units × price is the whole pricing model. Batching keeps you under the ~$20/day x402 default.
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
            <h2 className="font-display text-2xl tracking-tight">Invoice payload</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              The same object is written to both agents' ledgers. The receipt hash is the shared truth.
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
                ["meter/cap-exceeded", "Daily cap hit. Call is queued or blocked per policy and audited."],
                ["meter/settle-declined", "Wallet rejected settlement. Invoice stays open, no service delivered."],
                ["meter/ceiling", "Single call priced above the ceiling. Blocked before execution."],
                ["meter/no-receipt", "Settlement succeeded but receipt write failed — retried, then flagged."],
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
