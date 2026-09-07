import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { MeterMark } from "@/components/brand/MeterMark";
import { WaitlistForm } from "@/components/site/WaitlistForm";

export const Route = createFileRoute("/merch")({
  head: () => ({
    meta: [
      { title: "Merch — METER hoodies, tees & caps" },
      {
        name: "description",
        content:
          "The METER merch line: heavyweight hoodies, receipt tees and embroidered caps carrying the one-colour meter mark.",
      },
      { property: "og:title", content: "Merch — METER hoodies, tees & caps" },
      {
        property: "og:description",
        content: "One-colour mark, heavyweight cotton, ink and signal only.",
      },
    ],
  }),
  component: MerchPage,
});

type Item = {
  id: string;
  name: string;
  price: string;
  detail: string;
  print: "mark" | "wordmark" | "stack" | "receipt";
  surface: "ink" | "signal" | "soft";
};

const items: Item[] = [
  { id: "hoodie-ink", name: "Settle Hoodie", price: "$88", detail: "480gsm heavyweight, ink black, signal mark on chest, ledger line down the left sleeve.", print: "mark", surface: "ink" },
  { id: "hoodie-signal", name: "Signal Hoodie", price: "$88", detail: "Volt colourway, ink mark, drawcord tipped in ink. Loud on stage, fine in a call.", print: "mark", surface: "signal" },
  { id: "tee-receipt", name: "Receipt Tee", price: "$42", detail: "Back print of a real settled receipt: endpoint, units, hash. Front is just the bracket.", print: "receipt", surface: "ink" },
  { id: "tee-wordmark", name: "Wordmark Tee", price: "$38", detail: "220gsm, oversized fit, wordmark at 0.24em tracking across the chest.", print: "wordmark", surface: "soft" },
  { id: "cap", name: "Meter Cap", price: "$36", detail: "Unstructured 6-panel, embroidered mark in signal thread, ink strap.", print: "mark", surface: "soft" },
  { id: "stack", name: "Sticker Stack", price: "$12", detail: "Six die-cut vinyls: mark, wordmark, 402, settled, batched, declined.", print: "stack", surface: "ink" },
];

const surfaceClass: Record<Item["surface"], string> = {
  ink: "bg-ink",
  signal: "bg-primary",
  soft: "bg-ink-soft",
};

function PrintArt({ item }: { item: Item }) {
  const fg = item.surface === "signal" ? "text-primary-foreground" : "text-primary";
  if (item.print === "wordmark")
    return <span className={`font-display text-3xl tracking-[0.24em] ${fg}`}>METER</span>;
  if (item.print === "receipt")
    return (
      <div className={`font-mono text-[0.6rem] leading-5 ${fg} text-center`}>
        <MeterMark className="mx-auto mb-3 h-10 w-10" />
        /research · 1 query · $0.02
        <br />
        receipt · SETTLED
      </div>
    );
  if (item.print === "stack")
    return (
      <div className="flex gap-3">
        <MeterMark className={`h-10 w-10 ${fg}`} />
        <MeterMark className={`h-10 w-10 ${fg} opacity-60`} />
        <MeterMark className={`h-10 w-10 ${fg} opacity-30`} />
      </div>
    );
  return <MeterMark className={`h-20 w-20 ${fg}`} />;
}

function MerchPage() {
  const [bag, setBag] = useState<string[]>([]);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const toggle = (id: string) =>
    setBag((b) => (b.includes(id) ? b.filter((x) => x !== id) : [...b, id]));

  return (
    <PageShell
      eyebrow="Merch"
      title="Ink, signal, cotton."
      lede="Two colours, one mark, no gradients. Checkout is not live yet — shortlist pieces and join the drop waitlist."
    >
      <div className="mb-8 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <ShoppingBag className="h-4 w-4 text-primary" />
        {bag.length === 0 ? "Bag is empty" : `${bag.length} item${bag.length > 1 ? "s" : ""} shortlisted`}
        {bag.length > 0 && (
          <button
            type="button"
            onClick={() => setShowWaitlist(true)}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground"
          >
            Notify me when shipping
          </button>
        )}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const inBag = bag.includes(item.id);
          return (
            <article key={item.id} className="panel overflow-hidden">
              <div className={`flex aspect-[4/3] items-center justify-center ${surfaceClass[item.surface]}`}>
                <PrintArt item={item} />
              </div>
              <div className="p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-base font-medium">{item.name}</h2>
                  <span className="font-mono text-sm text-primary">{item.price}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
                <button
                  type="button"
                  onClick={() => {
                    toggle(item.id);
                    if (!inBag) setShowWaitlist(true);
                  }}
                  className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium ${
                    inBag
                      ? "border border-border text-foreground/80"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {inBag ? (
                    <>
                      <Check className="h-4 w-4 text-primary" /> Shortlisted
                    </>
                  ) : (
                    "Shortlist"
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {(showWaitlist || bag.length > 0) && (
        <section className="panel mt-10 p-8">
          <h2 className="font-display text-xl tracking-tight">Merch drop waitlist</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No fake checkout. We email when the print run ships
            {bag.length > 0 ? ` · interested in: ${bag.join(", ")}` : ""}.
          </p>
          <div className="mt-4 max-w-md">
            <WaitlistForm source={`merch:${bag.join("+") || "browse"}`} cta="Notify me" />
          </div>
        </section>
      )}

      <section className="panel mt-16 p-8">
        <h2 className="font-display text-2xl tracking-tight">Print specs</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {[
            ["Chest mark", "90mm wide, centred 75mm below collar seam. Screen print, one pass."],
            ["Embroidery", "Mark only, 55mm, 3-thread signal. Bars keep 2mm gaps at this size."],
            ["Colourways", "Ink on natural, signal on ink. Never signal on white."],
          ].map(([t, d]) => (
            <div key={t}>
              <p className="text-sm font-medium">{t}</p>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
        <Link to="/brand" className="mt-6 inline-block text-sm text-primary hover:underline">
          Read the full brand kit →
        </Link>
      </section>
    </PageShell>
  );
}
