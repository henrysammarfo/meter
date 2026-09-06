import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Waves,
  FileText,
  ReceiptText,
  Gauge,
  Settings,
  Menu,
  X,
  ArrowUpRight,
} from "lucide-react";
import { MeterMark } from "@/components/brand/MeterMark";
import { SETTLE_ASSET, SETTLE_CHAIN } from "@/lib/meter-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Ledger — METER dashboard" },
      {
        name: "description",
        content: "Paystream, invoices, receipts and limits for every agent spending against your metered APIs.",
      },
    ],
  }),
  component: DashboardLayout,
});

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/paystream", label: "Paystream", icon: Waves },
  { to: "/dashboard/invoices", label: "Invoices", icon: FileText },
  { to: "/dashboard/receipts", label: "Receipts", icon: ReceiptText },
  { to: "/dashboard/limits", label: "Limits", icon: Gauge },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

function DashboardLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="grid-ink min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside
        className={`panel fixed inset-y-0 left-0 z-50 w-64 flex-col justify-between rounded-none p-5 lg:sticky lg:top-0 lg:z-auto lg:flex lg:h-screen lg:w-auto ${
          open ? "flex" : "hidden"
        }`}
      >
        <div>
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
              <MeterMark className="size-7 text-primary" />
              <span className="font-display text-lg tracking-tight">METER</span>
            </Link>
            <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
              <X className="size-5" />
            </button>
          </div>

          <nav className="mt-8 space-y-1">
            {NAV.map((n) => {
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  activeOptions={{ exact: n.to === "/dashboard" }}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                  activeProps={{ className: "bg-primary/12 text-foreground" }}
                >
                  <Icon className="size-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 text-xs text-muted-foreground">
          <div className="rounded-lg border border-border/70 p-3">
            <p className="text-foreground">Settlement</p>
            <p className="mt-1">
              {SETTLE_ASSET} · {SETTLE_CHAIN}
            </p>
            <span className="mt-2 inline-flex items-center gap-1.5 text-primary">
              <span className="size-1.5 rounded-full bg-primary" /> ledger live
            </span>
          </div>
          <Link to="/demo" className="inline-flex items-center gap-1 hover:text-foreground">
            Replay the demo <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex items-center justify-between px-4 py-4 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <MeterMark className="size-6 text-primary" />
            <span className="font-display text-base">METER</span>
          </Link>
          <button onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
        </div>
        <main className="px-4 pb-16 sm:px-8 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
