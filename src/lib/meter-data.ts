/**
 * METER rate-card constants + formatters + ledger client.
 * Live usage/receipts/invoices come from GET /api/v1/ledger — never invent demo rows here.
 */

import { meterFetch } from "./meter-api";
import { workspaceAgentFilter } from "./meter-workspace";

export const TAKE_RATE = 0.009;
export const BATCH_FEE = 0.0004;
export const BATCH_SIZE = 250;
export const SETTLE_ASSET = "USDC";
export const SETTLE_CHAIN = "METER prepaid subaccount / x402";
export const DEMO_FUND_AMOUNT = 5;
export const DEMO_AGENT = "agent_demo_7c1";
export const DEMO_CALL_PRICE = 0.02;
export const DEMO_DAILY_CAP = 20;

export type Endpoint = {
  id: string;
  path: string;
  unit: string;
  pricePerUnit: number;
  calls24h: number;
  revenue24h?: number;
  p95ms?: number;
  status: "live" | "paused";
};

export type Invoice = {
  id: string;
  counterparty: string;
  agent: string;
  agentId?: string;
  amount: number;
  calls: number;
  issued: string;
  due: string;
  status: "paid" | "open" | "failed";
};

export type Receipt = {
  id: string;
  txHash: string;
  endpoint: string;
  agent: string;
  agentId?: string;
  amount: number;
  time: string;
  settle: "settled" | "batched" | "declined" | "queued";
};

export type LimitRule = {
  id: string;
  scope: string;
  cap: number;
  used: number;
  window: string;
  action: "block" | "queue" | "notify";
};

export type Agent = {
  id: string;
  label: string;
  owner: string;
  funded: number;
  spent24h: number;
  balance?: number;
  status: "active" | "throttled" | "suspended";
};

export type LedgerOverview = {
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
  agents: Agent[];
  endpoints: Endpoint[];
  receipts: Receipt[];
  invoices: Array<Invoice & { agentId: string }>;
  limits: LimitRule[];
  settleSeries: Array<{ t: string; settled: number; batched: number; declined: number }>;
  revenueByEndpoint: Array<{ name: string; value: number }>;
  /** Active workspace filter applied client-side (null = all). */
  workspaceFilter: string[] | null;
};

export const usd = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Math.abs(n) < 1 ? 3 : 2,
    maximumFractionDigits: Math.abs(n) < 1 ? 4 : 2,
  });

export const num = (n: number) => n.toLocaleString("en-US");

export const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

function inFilter(agentId: string | undefined, filter: string[] | null): boolean {
  if (!filter) return true;
  if (!agentId) return false;
  return filter.includes(agentId);
}

function since24hMs(): number {
  return Date.now() - 24 * 3600 * 1000;
}

function buildSettleSeries(
  receipts: Receipt[],
): Array<{ t: string; settled: number; batched: number; declined: number }> {
  const buckets = new Map<string, { settled: number; batched: number; declined: number }>();
  for (const r of receipts) {
    const hour = new Date(r.time);
    const t = `${String(hour.getUTCMonth() + 1).padStart(2, "0")}-${String(hour.getUTCDate()).padStart(2, "0")} ${String(hour.getUTCHours()).padStart(2, "0")}:00Z`;
    const b = buckets.get(t) ?? { settled: 0, batched: 0, declined: 0 };
    if (r.settle === "settled") b.settled += 1;
    else if (r.settle === "batched") b.batched += 1;
    else if (r.settle === "declined") b.declined += 1;
    buckets.set(t, b);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([t, v]) => ({ t, ...v }));
}

export async function fetchLedgerOverview(): Promise<LedgerOverview> {
  const { data } = await meterFetch<LedgerOverview>("/api/v1/ledger");
  const filter = workspaceAgentFilter();
  const cutoff = since24hMs();

  const agents = data.agents.filter((a) => inFilter(a.id, filter));
  const receipts = data.receipts
    .filter((r) => inFilter(r.agentId ?? r.agent, filter))
    .map((r) => ({
      ...r,
      agent: r.agentId ?? r.agent,
    }));
  const invoices = data.invoices
    .filter((i) => inFilter(i.agentId, filter))
    .map((i) => ({
      ...i,
      agent: i.agentId,
    }));

  const recent = receipts.filter((r) => Date.parse(r.time) >= cutoff);
  const paidRecent = recent.filter((r) => r.settle === "settled" || r.settle === "batched");

  const openInvoiceTotal = invoices
    .filter((i) => i.status === "open")
    .reduce((s, i) => s + i.amount, 0);
  const paidInvoiceTotal = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.amount, 0);
  const failedInvoiceTotal = invoices
    .filter((i) => i.status === "failed")
    .reduce((s, i) => s + i.amount, 0);

  const grossVolume24h = paidRecent.reduce((s, r) => s + r.amount, 0);
  const calls24h = paidRecent.length;
  const meterFee24h = Number((grossVolume24h * (data.takeRate ?? TAKE_RATE)).toFixed(6));

  const byEndpoint = new Map<string, { revenue24h: number; calls24h: number }>();
  for (const r of paidRecent) {
    const cur = byEndpoint.get(r.endpoint) ?? { revenue24h: 0, calls24h: 0 };
    cur.revenue24h += r.amount;
    cur.calls24h += 1;
    byEndpoint.set(r.endpoint, cur);
  }

  const endpoints = data.endpoints.map((e) => {
    const stats = byEndpoint.get(e.path) ?? { revenue24h: 0, calls24h: 0 };
    return {
      ...e,
      revenue24h: Number(stats.revenue24h.toFixed(4)),
      calls24h: stats.calls24h,
    };
  });

  const revenueByEndpoint = endpoints
    .filter((e) => e.status === "live")
    .map((e) => ({ name: e.path, value: e.revenue24h ?? 0 }));

  return {
    ...data,
    agents,
    receipts,
    invoices,
    endpoints,
    settleSeries: buildSettleSeries(recent),
    revenueByEndpoint,
    openInvoiceTotal: Number(openInvoiceTotal.toFixed(6)),
    paidInvoiceTotal: Number(paidInvoiceTotal.toFixed(6)),
    failedInvoiceTotal: Number(failedInvoiceTotal.toFixed(6)),
    grossVolume24h: Number(grossVolume24h.toFixed(6)),
    calls24h,
    meterFee24h,
    workspaceFilter: filter,
  };
}
