/** Mock ledger data powering the METER demo dashboard. */

export type Endpoint = {
  id: string;
  path: string;
  unit: string;
  pricePerUnit: number;
  calls24h: number;
  revenue24h: number;
  status: "live" | "paused";
};

export type Invoice = {
  id: string;
  counterparty: string;
  agent: string;
  amount: number;
  calls: number;
  issued: string;
  status: "paid" | "open" | "failed";
};

export type Receipt = {
  id: string;
  txHash: string;
  endpoint: string;
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

export const endpoints: Endpoint[] = [
  { id: "ep_research", path: "/research", unit: "query", pricePerUnit: 0.02, calls24h: 18420, revenue24h: 368.4, status: "live" },
  { id: "ep_embed", path: "/embed", unit: "1k tokens", pricePerUnit: 0.004, calls24h: 96210, revenue24h: 384.84, status: "live" },
  { id: "ep_onchain", path: "/onchain/scan", unit: "address", pricePerUnit: 0.05, calls24h: 3120, revenue24h: 156.0, status: "live" },
  { id: "ep_ocr", path: "/vision/ocr", unit: "page", pricePerUnit: 0.012, calls24h: 7440, revenue24h: 89.28, status: "paused" },
];

export const invoices: Invoice[] = [
  { id: "INV-2091", counterparty: "Northwind Labs", agent: "agent_b7f2", amount: 412.55, calls: 20627, issued: "Sep 2, 09:12", status: "paid" },
  { id: "INV-2090", counterparty: "Kite Research", agent: "agent_1c9a", amount: 168.2, calls: 8410, issued: "Sep 2, 06:40", status: "open" },
  { id: "INV-2089", counterparty: "Halo Trading Desk", agent: "agent_44de", amount: 92.0, calls: 1840, issued: "Sep 1, 23:05", status: "paid" },
  { id: "INV-2088", counterparty: "Solon Analytics", agent: "agent_9b31", amount: 26.75, calls: 1338, issued: "Sep 1, 18:22", status: "failed" },
  { id: "INV-2087", counterparty: "Northwind Labs", agent: "agent_b7f2", amount: 388.1, calls: 19405, issued: "Sep 1, 09:11", status: "paid" },
];

export const receipts: Receipt[] = [
  { id: "rc_88213", txHash: "0x9f4c…21ab", endpoint: "/research", amount: 0.02, time: "19:04:12", settle: "settled" },
  { id: "rc_88212", txHash: "0x71de…90f4", endpoint: "/embed", amount: 0.004, time: "19:04:11", settle: "batched" },
  { id: "rc_88211", txHash: "0x2a55…7cc1", endpoint: "/onchain/scan", amount: 0.05, time: "19:04:07", settle: "settled" },
  { id: "rc_88210", txHash: "0xb102…33ef", endpoint: "/research", amount: 0.02, time: "19:03:58", settle: "declined" },
  { id: "rc_88209", txHash: "0x4c8a…12b6", endpoint: "/embed", amount: 0.004, time: "19:03:52", settle: "batched" },
  { id: "rc_88208", txHash: "0xd930…5a77", endpoint: "/research", amount: 0.02, time: "19:03:49", settle: "settled" },
];

export const limits: LimitRule[] = [
  { id: "lm_daily", scope: "Workspace daily spend", cap: 20, used: 16.4, window: "24h", action: "queue" },
  { id: "lm_agent", scope: "agent_1c9a per-agent cap", cap: 8, used: 7.6, window: "24h", action: "block" },
  { id: "lm_call", scope: "Single call ceiling", cap: 0.25, used: 0.05, window: "per call", action: "block" },
  { id: "lm_burst", scope: "Burst rate", cap: 400, used: 218, window: "per minute", action: "notify" },
];

export const settleSeries = [
  { t: "00:00", settled: 42, batched: 18, failed: 2 },
  { t: "03:00", settled: 61, batched: 24, failed: 1 },
  { t: "06:00", settled: 88, batched: 31, failed: 4 },
  { t: "09:00", settled: 154, batched: 46, failed: 3 },
  { t: "12:00", settled: 132, batched: 52, failed: 6 },
  { t: "15:00", settled: 178, batched: 61, failed: 2 },
  { t: "18:00", settled: 205, batched: 74, failed: 5 },
  { t: "21:00", settled: 164, batched: 58, failed: 1 },
];

export const revenueByEndpoint = endpoints.map((e) => ({
  name: e.path,
  value: e.revenue24h,
}));

export const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: n < 1 ? 3 : 2 });

export const num = (n: number) => n.toLocaleString("en-US");
