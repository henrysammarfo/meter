import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { MeterMark } from "@/components/brand/MeterMark";

export const Route = createFileRoute("/brand")({
  head: () => ({
    meta: [
      { title: "Brand Kit — METER" },
      {
        name: "description",
        content:
          "The METER mark, wordmark, colour tokens, typography and usage rules — built to print clean on apparel, stickers and screens.",
      },
      { property: "og:title", content: "Brand Kit — METER" },
      {
        property: "og:description",
        content: "Mark, wordmark, palette, type scale and merch-safe usage rules.",
      },
    ],
  }),
  component: BrandPage,
});

const palette = [
  { name: "Ink", token: "--ink", note: "Primary surface. Everything sits on it." },
  { name: "Signal", token: "--primary", note: "The meter is live. One accent, used sparingly." },
  { name: "Relay", token: "--accent", note: "Secondary data, charts, links." },
  { name: "Warn", token: "--warning", note: "Cap approached, queued spend." },
  { name: "Fail", token: "--destructive", note: "Declined settlement only." },
];

const rules = [
  ["Do", "Keep clear space of one bracket-width around the mark."],
  ["Do", "Print the mark 1-colour: signal on ink, or ink on natural."],
  ["Do", "Lock the wordmark at 0.2em tracking, uppercase, always."],
  ["Don't", "Add gradients, bevels or drop shadows to the mark."],
  ["Don't", "Re-space the three bars — the ascent is the logo."],
  ["Don't", "Set the wordmark in the body font."],
];

function Swatch({ name, token, note }: { name: string; token: string; note: string }) {
  return (
    <div className="panel overflow-hidden">
      <div className="h-24" style={{ backgroundColor: `var(${token})` }} />
      <div className="p-4">
        <p className="text-sm font-medium">{name}</p>
        <p className="font-mono text-xs text-muted-foreground">var({token})</p>
        <p className="mt-2 text-xs text-muted-foreground">{note}</p>
      </div>
    </div>
  );
}

function BrandPage() {
  return (
    <PageShell
      eyebrow="Brand kit"
      title="A mark built to be worn."
      lede="METER is a bracket closing around three ascending bars: money entering a boundary and being counted. It survives embroidery, a 16px favicon and a chest print at 30cm."
    >
      <section className="grid gap-4 md:grid-cols-3">
        <div className="panel flex aspect-square items-center justify-center bg-ink">
          <MeterMark className="h-28 w-28 text-primary" />
        </div>
        <div className="panel flex aspect-square items-center justify-center bg-primary">
          <MeterMark className="h-28 w-28 text-primary-foreground" />
        </div>
        <div className="panel flex aspect-square flex-col items-center justify-center gap-4 bg-ink-soft">
          <MeterMark className="h-16 w-16" />
          <span className="font-display text-2xl tracking-[0.24em]">METER</span>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-2xl tracking-tight sm:text-3xl">Palette</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {palette.map((p) => (
            <Swatch key={p.token} {...p} />
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-4 lg:grid-cols-2">
        <div className="panel p-7">
          <h2 className="font-display text-2xl tracking-tight">Typography</h2>
          <p className="font-display mt-6 text-4xl tracking-tight">Askan Light — display</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Headlines, the wordmark, big numbers. Never below 18px.
          </p>
          <p className="mt-8 text-2xl font-light">Inter — interface</p>
          <p className="mt-2 text-sm text-muted-foreground">
            300/400/500/600. Body copy, labels, tables.
          </p>
          <p className="mt-8 font-mono text-lg">0x9f4c…21ab — mono</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Hashes, amounts in the ledger, code.
          </p>
        </div>

        <div className="panel p-7">
          <h2 className="font-display text-2xl tracking-tight">Voice &amp; usage</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Plain, exact, unhyped. We say what moved, how much, and who has the receipt.
            No "revolutionary". No exclamation marks in product copy.
          </p>
          <ul className="mt-6 space-y-3">
            {rules.map(([kind, text]) => (
              <li key={text} className="flex gap-3 text-sm">
                <span
                  className={`w-12 shrink-0 text-xs tracking-widest uppercase ${
                    kind === "Do" ? "text-primary" : "text-destructive"
                  }`}
                >
                  {kind}
                </span>
                <span className="text-foreground/80">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="panel mt-16 flex flex-col gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-tight">Put it on cotton</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The merch line applies these rules to hoodies, tees and caps.
          </p>
        </div>
        <Link
          to="/merch"
          className="self-start rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          See the merch line
        </Link>
      </section>
    </PageShell>
  );
}
