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

export async function fetchLedgerOverview(): Promise<LedgerOverview> {
  const { data } = await meterFetch<LedgerOverview>("/api/v1/ledger");
  const filter = workspaceAgentFilter();

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

  const openInvoiceTotal = invoices
    .filter((i) => i.status === "open")
    .reduce((s, i) => s + i.amount, 0);
  const paidInvoiceTotal = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.amount, 0);
  const failedInvoiceTotal = invoices
    .filter((i) => i.status === "failed")
    .reduce((s, i) => s + i.amount, 0);

  const grossVolume24h = receipts
    .filter((r) => r.settle === "settled" || r.settle === "batched")
    .reduce((s, r) => s + r.amount, 0);
  const calls24h = receipts.filter((r) => r.settle === "settled" || r.settle === "batched").length;
  const meterFee24h = Number((grossVolume24h * (data.takeRate ?? TAKE_RATE)).toFixed(6));

  return {
    ...data,
    agents,
    receipts,
    invoices,
    openInvoiceTotal: Number(openInvoiceTotal.toFixed(6)),
    paidInvoiceTotal: Number(paidInvoiceTotal.toFixed(6)),
    failedInvoiceTotal: Number(failedInvoiceTotal.toFixed(6)),
    grossVolume24h: Number(grossVolume24h.toFixed(6)),
    calls24h,
    meterFee24h,
    workspaceFilter: filter,
  };
}
