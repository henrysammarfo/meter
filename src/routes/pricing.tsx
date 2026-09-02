import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — METER" },
      {
        name: "description",
        content:
          "Seats from $49/mo plus 1–2% on settled volume. Metered endpoints, agent invoices and shared receipts included on every plan.",
      },
      { property: "og:title", content: "Pricing — METER" },
      {
        property: "og:description",
        content: "Seats plus a settle take. No per-seat surprises for agents.",
      },
    ],
  }),
  component: PricingPage,
});

const tiers = [
  {
    name: "Operator",
    price: "$49",
    take: "2% settle take",
    for: "Solo agent operators and indie API sellers",
    features: ["3 metered endpoints", "Agent-to-agent invoices", "Shared receipts", "Daily spend caps", "Community support"],
    cta: "Start metering",
    featured: false,
  },
  {
    name: "Studio",
    price: "$199",
    take: "1.5% settle take",
    for: "Teams shipping paid skills on Agent OS",
    features: ["Unlimited endpoints", "Per-agent policy limits", "Batching under the daily cap", "Flovia analytics + exports", "5 seats included", "Priority support"],
    cta: "Start 14-day trial",
    featured: true,
  },
  {
    name: "Network",
    price: "Custom",
    take: "1% settle take",
    for: "Marketplaces settling for many agents",
    features: ["Multi-workspace ledger", "Sub-account sandboxes", "Custom settle rails", "SLA + audit exports", "Dedicated engineer"],
    cta: "Talk to us",
    featured: false,
  },
];

const faqs = [
  { q: "Why a settle take instead of per-call fees?", a: "Agent calls are $0.002–$0.05. A fixed per-call fee would cost more than the call. A percentage of settled volume scales with the money that actually moves." },
  { q: "What happens at the daily cap?", a: "METER queues or blocks per your policy and writes an audit row. The client agent gets a structured failure, not a timeout." },
  { q: "Do I need Binance Agent OS?", a: "METER is built for Agent OS and x402 settlement, and the ledger also accepts any HTTP 402-compatible rail." },
  { q: "Who owns the receipt?", a: "Both agents. One hash, two copies, no reconciliation call." },
];

function PricingPage() {
  return (
    <PageShell
      eyebrow="Pricing"
      title="Priced on money that moves."
      lede="A seat to run the ledger, plus a small take on what actually settles. Micropayments stay economical all the way down to two cents."
    >
      <section className="grid gap-4 lg:grid-cols-3">
        {tiers.map((t) => (
          <article
            key={t.name}
            className={`panel relative p-7 ${t.featured ? "ring-1 ring-primary" : ""}`}
          >
            {t.featured && (
              <span className="absolute -top-3 left-7 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[0.7rem] font-medium text-primary-foreground">
                <Sparkles className="h-3 w-3" /> Most picked
              </span>
            )}
            <h2 className="font-display text-xl tracking-[0.14em] uppercase">{t.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.for}</p>
            <div className="mt-6 flex items-end gap-1">
              <span className="font-display text-4xl">{t.price}</span>
              {t.price !== "Custom" && <span className="pb-1 text-sm text-muted-foreground">/mo</span>}
            </div>
            <p className="mt-1 text-sm text-primary">{t.take}</p>
            <ul className="mt-6 space-y-3">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-foreground/80">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/dashboard"
              className={`mt-7 block rounded-full px-5 py-3 text-center text-sm font-medium ${
                t.featured
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-foreground/85 hover:text-foreground"
              }`}
            >
              {t.cta}
            </Link>
          </article>
        ))}
      </section>

      <section className="mt-16">
        <h2 className="font-display text-2xl tracking-tight sm:text-3xl">Questions we get asked</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {faqs.map((f) => (
            <div key={f.q} className="panel p-6">
              <h3 className="text-sm font-medium">{f.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
