/**
 * METER ledger data.
 *
 * Single source of truth for the marketing demo and the dashboard. Every
 * aggregate below is DERIVED from the primitives (rate card + call volume +
 * receipts) so the /demo flow and the dashboard can never drift apart.
 */

/* ------------------------------------------------------------------ rates */

/** METER take rate on settled volume (settle-take pricing). */
export const TAKE_RATE = 0.009; // 0.9%
/** Flat network fee per settled x402 batch, in USDC. */
export const BATCH_FEE = 0.0004;
/** Calls rolled into one on-chain settlement batch. */
export const BATCH_SIZE = 250;
/** Stablecoin used for settlement. */
export const SETTLE_ASSET = "USDC";
export const SETTLE_CHAIN = "BNB Smart Chain";

export type Endpoint = {
  id: string;
  path: string;
  unit: string;
  pricePerUnit: number;
  calls24h: number;
  p95ms: number;
  status: "live" | "paused";
};

export type Invoice = {
  id: string;
  counterparty: string;
  agent: string;
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
  amount: number;
  time: string;
  settle: "settled" | "batched" | "declined";
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
  status: "active" | "throttled" | "suspended";
};

/* -------------------------------------------------------------- primitives */

export const endpoints: Endpoint[] = [
  { id: "ep_research", path: "/research", unit: "query", pricePerUnit: 0.02, calls24h: 18420, p95ms: 812, status: "live" },
  { id: "ep_embed", path: "/embed", unit: "1k tokens", pricePerUnit: 0.004, calls24h: 96210, p95ms: 96, status: "live" },
  { id: "ep_onchain", path: "/onchain/scan", unit: "address", pricePerUnit: 0.05, calls24h: 3120, p95ms: 1340, status: "live" },
  { id: "ep_rerank", path: "/rerank", unit: "batch", pricePerUnit: 0.008, calls24h: 24880, p95ms: 141, status: "live" },
  { id: "ep_ocr", path: "/vision/ocr", unit: "page", pricePerUnit: 0.012, calls24h: 7440, p95ms: 2210, status: "paused" },
];

export const agents: Agent[] = [
  { id: "agent_b7f2", label: "Northwind Scout", owner: "Northwind Labs", funded: 500, spent24h: 412.55, status: "active" },
  { id: "agent_1c9a", label: "Kite Analyst", owner: "Kite Research", funded: 200, spent24h: 168.2, status: "throttled" },
  { id: "agent_44de", label: "Halo Desk", owner: "Halo Trading Desk", funded: 150, spent24h: 92.0, status: "active" },
  { id: "agent_9b31", label: "Solon Crawler", owner: "Solon Analytics", funded: 25, spent24h: 26.75, status: "suspended" },
];

export const invoices: Invoice[] = [
  { id: "INV-2091", counterparty: "Northwind Labs", agent: "agent_b7f2", amount: 412.55, calls: 20627, issued: "Sep 2, 09:12", due: "Sep 9", status: "paid" },
  { id: "INV-2090", counterparty: "Kite Research", agent: "agent_1c9a", amount: 168.2, calls: 8410, issued: "Sep 2, 06:40", due: "Sep 9", status: "open" },
  { id: "INV-2089", counterparty: "Halo Trading Desk", agent: "agent_44de", amount: 92.0, calls: 1840, issued: "Sep 1, 23:05", due: "Sep 8", status: "paid" },
  { id: "INV-2088", counterparty: "Solon Analytics", agent: "agent_9b31", amount: 26.75, calls: 1338, issued: "Sep 1, 18:22", due: "Sep 8", status: "failed" },
  { id: "INV-2087", counterparty: "Northwind Labs", agent: "agent_b7f2", amount: 388.1, calls: 19405, issued: "Sep 1, 09:11", due: "Sep 8", status: "paid" },
  { id: "INV-2086", counterparty: "Kite Research", agent: "agent_1c9a", amount: 141.6, calls: 7080, issued: "Aug 31, 07:02", due: "Sep 7", status: "paid" },
];

export const receipts: Receipt[] = [
  { id: "rc_88213", txHash: "0x9f4c…21ab", endpoint: "/research", agent: "agent_b7f2", amount: 0.02, time: "19:04:12", settle: "settled" },
  { id: "rc_88212", txHash: "0x71de…90f4", endpoint: "/embed", agent: "agent_1c9a", amount: 0.004, time: "19:04:11", settle: "batched" },
  { id: "rc_88211", txHash: "0x2a55…7cc1", endpoint: "/onchain/scan", agent: "agent_44de", amount: 0.05, time: "19:04:07", settle: "settled" },
  { id: "rc_88210", txHash: "0xb102…33ef", endpoint: "/research", agent: "agent_9b31", amount: 0.02, time: "19:03:58", settle: "declined" },
  { id: "rc_88209", txHash: "0x4c8a…12b6", endpoint: "/embed", agent: "agent_1c9a", amount: 0.004, time: "19:03:52", settle: "batched" },
  { id: "rc_88208", txHash: "0xd930…5a77", endpoint: "/research", agent: "agent_b7f2", amount: 0.02, time: "19:03:49", settle: "settled" },
  { id: "rc_88207", txHash: "0x0f61…8ba2", endpoint: "/rerank", agent: "agent_b7f2", amount: 0.008, time: "19:03:41", settle: "settled" },
  { id: "rc_88206", txHash: "0x77c3…4d19", endpoint: "/onchain/scan", agent: "agent_44de", amount: 0.05, time: "19:03:30", settle: "batched" },
];

export const limits: LimitRule[] = [
  { id: "lm_daily", scope: "Workspace daily spend", cap: 20, used: 16.4, window: "24h", action: "queue" },
  { id: "lm_agent", scope: "agent_1c9a per-agent cap", cap: 8, used: 7.6, window: "24h", action: "block" },
  { id: "lm_call", scope: "Single call ceiling", cap: 0.25, used: 0.05, window: "per call", action: "block" },
  { id: "lm_burst", scope: "Burst rate", cap: 400, used: 218, window: "per minute", action: "notify" },
];

/* ---------------------------------------------------------------- derived */

export const endpointRevenue = endpoints.map((e) => ({
  ...e,
  revenue24h: Number((e.pricePerUnit * e.calls24h).toFixed(2)),
}));

export const revenueByEndpoint = endpointRevenue
  .filter((e) => e.status === "live")
  .map((e) => ({ name: e.path, value: e.revenue24h }));

export const grossVolume24h = Number(
  endpointRevenue.reduce((s, e) => s + e.revenue24h, 0).toFixed(2),
);
export const calls24h = endpoints.reduce((s, e) => s + e.calls24h, 0);
export const meterFee24h = Number((grossVolume24h * TAKE_RATE).toFixed(2));
export const batches24h = Math.ceil(calls24h / BATCH_SIZE);
export const networkCost24h = Number((batches24h * BATCH_FEE).toFixed(4));
export const netToOperator24h = Number(
  (grossVolume24h - meterFee24h - networkCost24h).toFixed(2),
);
export const avgPricePerCall = Number((grossVolume24h / calls24h).toFixed(5));

export const openInvoiceTotal = Number(
  invoices.filter((i) => i.status === "open").reduce((s, i) => s + i.amount, 0).toFixed(2),
);
export const paidInvoiceTotal = Number(
  invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0).toFixed(2),
);
export const failedInvoiceTotal = Number(
  invoices.filter((i) => i.status === "failed").reduce((s, i) => s + i.amount, 0).toFixed(2),
);

/** Flovia settlement analytics: settled / batched / declined calls per 3h. */
export const settleSeries = [
  { t: "00:00", settled: 4210, batched: 1840, declined: 22 },
  { t: "03:00", settled: 6110, batched: 2410, declined: 14 },
  { t: "06:00", settled: 8830, batched: 3120, declined: 41 },
  { t: "09:00", settled: 15420, batched: 4610, declined: 33 },
  { t: "12:00", settled: 13210, batched: 5220, declined: 62 },
  { t: "15:00", settled: 17840, batched: 6110, declined: 25 },
  { t: "18:00", settled: 20510, batched: 7410, declined: 51 },
  { t: "21:00", settled: 16480, batched: 5820, declined: 18 },
];

/** Spend per agent over the last 7 days, in USDC. */
export const agentSpendSeries = [
  { d: "Aug 27", northwind: 288.4, kite: 96.1, halo: 61.2, solon: 18.0 },
  { d: "Aug 28", northwind: 312.9, kite: 108.4, halo: 70.4, solon: 21.5 },
  { d: "Aug 29", northwind: 341.2, kite: 121.0, halo: 66.8, solon: 24.1 },
  { d: "Aug 30", northwind: 359.6, kite: 133.7, halo: 74.9, solon: 25.9 },
  { d: "Aug 31", northwind: 371.8, kite: 141.6, halo: 81.2, solon: 26.3 },
  { d: "Sep 1", northwind: 388.1, kite: 152.4, halo: 92.0, solon: 26.75 },
  { d: "Sep 2", northwind: 412.55, kite: 168.2, halo: 88.6, solon: 0 },
];

export const settleLatency = [
  { bucket: "<1s", calls: 61240 },
  { bucket: "1–2s", calls: 48120 },
  { bucket: "2–5s", calls: 29410 },
  { bucket: "5–10s", calls: 8120 },
  { bucket: ">10s", calls: 3180 },
];

/* ------------------------------------------------------------ demo script */

/** The five beats of the /demo flow, priced from the same rate card. */
export const DEMO_FUND_AMOUNT = 5;
export const DEMO_AGENT = "agent_demo_7c1";
export const DEMO_CALL_PRICE = endpoints[0]!.pricePerUnit; // /research
export const DEMO_DAILY_CAP = 0.1;

/* --------------------------------------------------------------- format */

export const usd = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Math.abs(n) < 1 ? 3 : 2,
    maximumFractionDigits: Math.abs(n) < 1 ? 4 : 2,
  });

export const num = (n: number) => n.toLocaleString("en-US");

export const pct = (n: number) => `${(n * 100).toFixed(2)}%`;
