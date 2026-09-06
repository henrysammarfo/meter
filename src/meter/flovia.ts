import { publicAgent } from "./security";
/**
 * FLOVIA — analytics derived only from the live ledger.
 */

import { getLedger, refreshLimitUsage } from "./ledger";
import type { LedgerSnapshot } from "./types";

export interface FloviaOverview {
  updatedAt: string;
  takeRate: number;
  dailyCapUsdc: number;
  settleAsset: string;
  settleChainLabel: string;
  grossVolume24h: number;
  calls24h: number;
  meterFee24h: number;
  openInvoiceTotal: number;
  paidInvoiceTotal: number;
  failedInvoiceTotal: number;
  agents: LedgerSnapshot["agents"];
  endpoints: Array<LedgerSnapshot["endpoints"][number] & { revenue24h: number; calls24h: number }>;
  receipts: LedgerSnapshot["receipts"];
  invoices: LedgerSnapshot["invoices"];
  limits: LedgerSnapshot["limits"];
  settleSeries: Array<{ t: string; settled: number; batched: number; declined: number }>;
  revenueByEndpoint: Array<{ name: string; value: number }>;
}

function since24h(): number {
  return Date.now() - 24 * 3600 * 1000;
}

export async function buildFloviaOverview(): Promise<FloviaOverview> {
  const ledger = await getLedger();
  const limits = await refreshLimitUsage();
  const cutoff = since24h();
  const recent = ledger.receipts.filter((r) => Date.parse(r.time) >= cutoff);

  const byEndpoint = new Map<string, { revenue24h: number; calls24h: number }>();
  for (const r of recent) {
    if (r.settle === "declined") continue;
    const cur = byEndpoint.get(r.endpoint) ?? { revenue24h: 0, calls24h: 0 };
    cur.revenue24h += r.amount;
    cur.calls24h += 1;
    byEndpoint.set(r.endpoint, cur);
  }

  const endpoints = ledger.endpoints.map((e) => {
    const stats = byEndpoint.get(e.path) ?? { revenue24h: 0, calls24h: 0 };
    return {
      ...e,
      revenue24h: Number(stats.revenue24h.toFixed(4)),
      calls24h: stats.calls24h,
    };
  });

  const grossVolume24h = Number(
    endpoints.reduce((s, e) => s + e.revenue24h, 0).toFixed(4),
  );
  const calls24h = endpoints.reduce((s, e) => s + e.calls24h, 0);
  const meterFee24h = Number((grossVolume24h * ledger.takeRate).toFixed(4));

  const buckets = new Map<string, { settled: number; batched: number; declined: number }>();
  for (const r of recent) {
    const hour = new Date(r.time);
    const t = `${String(hour.getUTCHours()).padStart(2, "0")}:00`;
    const b = buckets.get(t) ?? { settled: 0, batched: 0, declined: 0 };
    if (r.settle === "settled") b.settled += 1;
    else if (r.settle === "batched") b.batched += 1;
    else if (r.settle === "declined") b.declined += 1;
    buckets.set(t, b);
  }
  const settleSeries = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([t, v]) => ({ t, ...v }));

  return {
    updatedAt: ledger.updatedAt,
    takeRate: ledger.takeRate,
    dailyCapUsdc: ledger.dailyCapUsdc,
    settleAsset: ledger.settleAsset,
    settleChainLabel: ledger.settleChainLabel,
    grossVolume24h,
    calls24h,
    meterFee24h,
    openInvoiceTotal: Number(
      ledger.invoices.filter((i) => i.status === "open").reduce((s, i) => s + i.amount, 0).toFixed(4),
    ),
    paidInvoiceTotal: Number(
      ledger.invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0).toFixed(4),
    ),
    failedInvoiceTotal: Number(
      ledger.invoices.filter((i) => i.status === "failed").reduce((s, i) => s + i.amount, 0).toFixed(4),
    ),
    agents: ledger.agents.map((a) => publicAgent(a)),
    endpoints,
    receipts: ledger.receipts.slice(0, 100),
    invoices: ledger.invoices.slice(0, 100),
    limits,
    settleSeries,
    revenueByEndpoint: endpoints
      .filter((e) => e.status === "live")
      .map((e) => ({ name: e.path, value: e.revenue24h })),
  };
}
