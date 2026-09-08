import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { fetchHealth, probeLabel, type MeterHealth } from "@/lib/meter-api";
import {
  getActiveWorkspace,
  listWorkspaces,
  setActiveWorkspace,
} from "@/lib/meter-workspace";
import {
  isMeterSignedIn,
  operatorKeyHint,
  restoreSession,
} from "@/lib/meter-session";
import { useWorkspaceRevision } from "@/components/site/WaitlistForm";
import {
  AuthStatusChip,
  ConnectWalletButton,
} from "@/components/site/ConnectWalletButton";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: ({ location }) => {
    if (typeof window === "undefined") return;
    const path = location.pathname;
    const isSettings = path === "/dashboard/settings" || path.startsWith("/dashboard/settings/");
    if (!isSettings && !isMeterSignedIn()) {
      throw redirect({ to: "/dashboard/settings" });
    }
  },
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
  const [health, setHealth] = useState<MeterHealth | null>(null);
  const rev = useWorkspaceRevision();
  const workspace = getActiveWorkspace();
  const workspaces = listWorkspaces();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const signedIn = isMeterSignedIn();
  const isSettings = pathname.startsWith("/dashboard/settings");

  useEffect(() => {
    void restoreSession();
  }, []);

  useEffect(() => {
    if (!isSettings && !isMeterSignedIn()) {
      void navigate({ to: "/dashboard/settings" });
    }
  }, [isSettings, navigate, rev]);

  useEffect(() => {
    let cancelled = false;
    fetchHealth(false)
      .then(({ data }) => {
        if (!cancelled) setHealth(data);
      })
      .catch(() => {
        if (!cancelled) setHealth(null);
      });
    return () => {
      cancelled = true;
    };
  }, [rev]);

  const ledgerLive = health?.ok === true;
  const tavily = health ? probeLabel(health.live.tavily) : "…";
  const isDemoWs = workspace.id === "ws_public_demo";

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

          <div className="mt-5">
            <ConnectWalletButton
              variant="dashboard"
              className="w-full items-stretch [&_button]:w-full [&_button]:justify-center"
            />
          </div>

          <label className="mt-6 block text-[0.65rem] tracking-widest text-muted-foreground uppercase">
            Workspace
          </label>
          <select
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm"
            value={workspace.id}
            onChange={(e) => setActiveWorkspace(e.target.value)}
          >
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          <nav className="mt-6 space-y-1">
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
            <span
              className={`mt-2 inline-flex items-center gap-1.5 ${ledgerLive ? "text-primary" : "text-warning"}`}
            >
              <span
                className={`size-1.5 rounded-full ${ledgerLive ? "bg-primary" : "bg-warning"}`}
              />
              {health ? (ledgerLive ? "ledger live" : "ledger degraded") : "checking…"}
            </span>
            <p className="mt-1 text-[0.65rem]">Tavily {tavily}</p>
            <div className="mt-2">
              <AuthStatusChip />
            </div>
          </div>
          <Link to="/demo" className="inline-flex items-center gap-1 hover:text-foreground">
            Replay the demo <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3 px-4 py-4 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <MeterMark className="size-6 text-primary" />
            <span className="font-display text-base">METER</span>
          </Link>
          <div className="flex items-center gap-2">
            <ConnectWalletButton variant="nav" />
            <button onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="size-5" />
            </button>
          </div>
        </div>
        {!signedIn && isSettings && (
          <div className="border-b border-border/70 bg-primary/8 px-4 py-3 text-xs sm:px-8">
            <p className="font-medium text-foreground">Sign in to open the ledger</p>
            <p className="mt-1 text-muted-foreground">{operatorKeyHint()}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <ConnectWalletButton variant="dashboard" />
              <Link to="/demo" className="text-primary hover:underline">
                Or run /demo (stores demo session) →
              </Link>
            </div>
          </div>
        )}
        {isDemoWs && signedIn && (
          <div className="border-b border-border/70 bg-secondary/40 px-4 py-2.5 text-xs text-muted-foreground sm:px-8">
            Viewing the <span className="text-foreground">public demo</span> workspace (
            agent_demo_7c1). Demo invoices can be marked paid without an operator key. Fund / issue
            for other agents still needs the operator key in Settings.
          </div>
        )}
        <main className="px-4 pb-16 sm:px-8 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
