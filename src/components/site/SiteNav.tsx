import { Link } from "@tanstack/react-router";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { MeterMark } from "@/components/brand/MeterMark";
import { ConnectWalletButton } from "@/components/site/ConnectWalletButton";

const links = [
  { to: "/product", label: "Product" },
  { to: "/pricing", label: "Pricing" },
  { to: "/docs", label: "Docs" },
  { to: "/brand", label: "Brand" },
  { to: "/merch", label: "Merch" },
] as const;

export function SiteNav({ tone = "over" }: { tone?: "over" | "solid" }) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="relative flex items-center justify-between">
      <div
        className={`flex items-center rounded-2xl px-4 py-2.5 sm:px-6 sm:py-4 ${
          tone === "over" ? "glass" : "panel rounded-2xl"
        }`}
      >
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <MeterMark className="h-5 w-5 text-primary sm:h-7 sm:w-7" />
          <span className="font-display text-base tracking-[0.2em] sm:text-xl">METER</span>
        </Link>

        <div className="ml-6 hidden items-center gap-6 md:flex lg:ml-16">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm text-foreground/70 transition-colors hover:text-foreground"
              activeProps={{ className: "text-sm text-primary" }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="ml-4 md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="hidden items-center gap-3 sm:flex">
        <ConnectWalletButton variant="nav" />
        <Link
          to="/demo"
          className="rounded-full border border-border px-5 py-3 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
        >
          Live demo
        </Link>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Open ledger <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {open && (
        <div className="glass-strong absolute top-[4.5rem] right-0 left-0 z-30 rounded-2xl p-5 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="text-sm text-foreground/85"
              >
                {l.label}
              </Link>
            ))}
            <div onClick={() => setOpen(false)}>
              <ConnectWalletButton
                variant="nav"
                className="items-stretch [&_button]:w-full [&_button]:justify-center"
              />
            </div>
            <Link to="/demo" onClick={() => setOpen(false)} className="text-sm text-foreground/85">
              Live demo
            </Link>
            <Link
              to="/dashboard"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-full bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground"
            >
              Open ledger
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
