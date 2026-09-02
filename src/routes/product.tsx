import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Gauge,
  ReceiptText,
  ChartNoAxesCombined,
  ShieldCheck,
  Layers,
  Workflow,
  ArrowRight,
} from "lucide-react";
import { PageShell } from "@/components/site/PageShell";

export const Route = createFileRoute("/product")({
  head: () => ({
    meta: [
      { title: "Product — METER Paystream, Invoice & Flovia" },
      {
        name: "description",
        content:
          "Three modules: Paystream meters endpoints, Invoice bills agent-to-agent, Flovia reports it. One shared ledger for agent payments.",
      },
      { property: "og:title", content: "Product — METER Paystream, Invoice & Flovia" },
      {
        property: "og:description",
        content: "Metered endpoints, A2A invoices and dashboard analytics in one product.",
      },
    ],
  }),
  component: ProductPage,
});

const modules = [
  {
    icon: Gauge,
    name: "PAYSTREAM",
    job: "Metered endpoints",
    body: "Drop the middleware in front of any route. METER counts units × price, answers with a 402 challenge, and settles over x402 the moment the client agent pays.",
    points: ["Unit + price per route", "402 challenge / settle", "Batching under the daily cap"],
  },
  {
    icon: ReceiptText,
    name: "INVOICE",
    job: "Agent-to-agent billing",
    body: "Usage rolls into an invoice addressed to the client agent, not a human. It pays itself inside policy — and both sides keep the same receipt.",
    points: ["A2A bill + auto-pay", "Shared receipt hash", "Dispute-ready audit trail"],
  },
  {
    icon: ChartNoAxesCombined,
    name: "FLOVIA",
    job: "Dashboard analytics",
    body: "Usage, settlements, failures and limits in one view. Revenue by endpoint, spend by agent, and exactly which call hit the ceiling.",
    points: ["Revenue by endpoint", "Spend by agent", "Failure + limit forensics"],
  },
];

const flow = [
  { icon: Workflow, t: "Agent A exposes a paid skill", d: "Meter middleware prices the call in units." },
  { icon: Layers, t: "Agent B calls it", d: "402 challenge returns price, terms and settle address." },
  { icon: ShieldCheck, t: "Policy check", d: "Daily cap, per-agent cap and call ceiling evaluated before spend." },
  { icon: ReceiptText, t: "Settle + receipt", d: "x402 settles, invoice posts, both agents see identical proof." },
];

function ProductPage() {
  return (
    <PageShell
      eyebrow="Product"
      title="Three modules. One shared truth."
      lede="Delete METER and payments still happen — but nobody has one ledger. Paystream, Invoice and Flovia are the three pieces that make agent money legible."
    >
      <section className="grid gap-4 md:grid-cols-3">
        {modules.map((m) => (
          <article key={m.name} className="panel p-6">
            <m.icon className="h-6 w-6 text-primary" />
            <h2 className="font-display mt-5 text-xl tracking-[0.16em]">{m.name}</h2>
            <p className="text-xs tracking-widest text-muted-foreground uppercase">{m.job}</p>
            <p className="mt-4 text-sm leading-relaxed text-foreground/75">{m.body}</p>
            <ul className="mt-5 space-y-2">
              {m.points.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {p}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="mt-16">
        <h2 className="font-display text-2xl tracking-tight sm:text-3xl">The settle path</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {flow.map((s, i) => (
            <div key={s.t} className="panel p-5">
              <div className="flex items-center justify-between">
                <s.icon className="h-5 w-5 text-accent" />
                <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
              </div>
              <h3 className="mt-4 text-sm font-medium">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel mt-16 flex flex-col gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-tight">See it clear a $0.02 call</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Run the five-beat demo: fund, call, 402, invoice, limit.
          </p>
        </div>
        <Link
          to="/demo"
          className="inline-flex items-center gap-2 self-start rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Run the demo <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </PageShell>
  );
}
