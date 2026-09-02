import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowUpRight, Menu, X, Check } from "lucide-react";
import { MeterMark } from "@/components/brand/MeterMark";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "METER — The Ledger for Agent Money" },
      {
        name: "description",
        content:
          "METER meters paid API calls, settles them over x402, and gives both agents one shared receipt. Usage, invoices and limits in a single ledger.",
      },
      { property: "og:title", content: "METER — The Ledger for Agent Money" },
      {
        property: "og:description",
        content:
          "Agent-to-agent payments, API metering and shared receipts on Binance Agent OS.",
      },
    ],
  }),
  component: Landing,
});

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260618_174853_aac61aa2-0f3f-4cf1-bc78-7f657dd11164.mp4";

const pills = ["Metered endpoints", "Agent-to-agent invoices", "Shared receipts"];

function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setJoined(true);
    setEmail("");
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-ink">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover object-[80%_center] md:object-right lg:object-center"
        src={VIDEO_URL}
      />

      <div className="absolute inset-0 z-10 flex flex-col px-4 py-4 sm:px-10 sm:py-8 lg:px-12">
        {/* Nav */}
        <nav className="relative flex items-center justify-between">
          <div className="glass flex items-center rounded-2xl px-4 py-2.5 sm:px-6 sm:py-4">
            <MeterMark className="h-5 w-5 sm:h-7 sm:w-7" />
            <span className="font-display ml-2.5 text-base tracking-[0.2em] sm:text-xl">
              METER
            </span>
            <div className="ml-10 hidden items-center gap-7 lg:flex">
              <Link to="/product" className="text-sm text-foreground/70 hover:text-foreground">Product</Link>
              <Link to="/pricing" className="text-sm text-foreground/70 hover:text-foreground">Pricing</Link>
              <Link to="/docs" className="text-sm text-foreground/70 hover:text-foreground">Docs</Link>
              <Link to="/merch" className="text-sm text-foreground/70 hover:text-foreground">Merch</Link>
            </div>
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((v) => !v)}
              className="ml-4 sm:ml-32 md:ml-64 lg:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              to="/demo"
              className="rounded-full border border-border px-5 py-3 text-sm text-foreground/85 backdrop-blur-md hover:text-foreground"
            >
              Watch the flow
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
            >
              Open ledger <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {menuOpen && (
            <div className="glass-strong absolute top-[4.5rem] right-0 left-0 z-30 rounded-2xl p-5 lg:hidden">
              <div className="flex flex-col gap-4">
                <Link to="/product" onClick={() => setMenuOpen(false)} className="text-sm">Product</Link>
                <Link to="/pricing" onClick={() => setMenuOpen(false)} className="text-sm">Pricing</Link>
                <Link to="/docs" onClick={() => setMenuOpen(false)} className="text-sm">Docs</Link>
                <Link to="/brand" onClick={() => setMenuOpen(false)} className="text-sm">Brand</Link>
                <Link to="/merch" onClick={() => setMenuOpen(false)} className="text-sm">Merch</Link>
                <Link to="/demo" onClick={() => setMenuOpen(false)} className="text-sm">Live demo</Link>
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-full bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground"
                >
                  Open ledger
                </Link>
              </div>
            </div>
          )}
        </nav>

        <div className="flex-1 sm:hidden" />

        {/* Main */}
        <div className="flex flex-col pb-4 sm:mt-auto sm:flex-1 sm:flex-row sm:items-end sm:pb-12 lg:pb-16">
          <div className="flex flex-col gap-4 sm:flex-1 sm:gap-6">
            <h1 className="font-display max-w-[760px] text-[2rem] leading-[1.05] tracking-tight sm:text-[3.5rem] md:text-[4.5rem] lg:text-[5.5rem]">
              Every agent payment, on one meter.
            </h1>
            <p className="max-w-[540px] text-xs leading-relaxed text-foreground/70 sm:text-base md:text-lg">
              When AIs pay each other or charge for an API call, METER shows the money,
              issues the receipt, and settles it automatically — inside the limits you set.
            </p>

            <form onSubmit={submit} className="relative max-w-[520px]">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your work email"
                className="glass w-full rounded-full bg-transparent px-4 py-3 text-sm placeholder:text-foreground/45 focus:outline-none focus:ring-2 focus:ring-ring sm:px-6 sm:py-4"
              />
              <button
                type="submit"
                className="absolute top-1.5 right-1.5 bottom-1.5 rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground sm:px-6 sm:text-sm"
              >
                {joined ? "You're in" : "Get access"}
              </button>
            </form>
            {joined && (
              <p className="flex items-center gap-1.5 text-xs text-primary">
                <Check className="h-3.5 w-3.5" /> Added to the METER early-access list.
              </p>
            )}

            <div className="mt-1 flex flex-wrap gap-2 sm:hidden">
              {pills.map((p) => (
                <span key={p} className="glass rounded-full px-3 py-1.5 text-xs">
                  {p}
                </span>
              ))}
            </div>
          </div>

          <div className="hidden flex-col items-end gap-2 self-end sm:flex">
            {pills.map((p) => (
              <span key={p} className="glass rounded-full px-4 py-2 text-xs sm:text-sm">
                {p}
              </span>
            ))}
            <span className="glass rounded-full px-4 py-2 text-xs text-primary sm:text-sm">
              Clears $0.02 calls Stripe can't
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
