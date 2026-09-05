/**
 * Shared domain types for PAYSTREAM · INVOICE · FLOVIA.
 */

export type SettleStatus = "settled" | "batched" | "declined" | "queued";

export type AgentStatus = "active" | "throttled" | "suspended";

export type InvoiceStatus = "paid" | "open" | "failed";

export type EndpointStatus = "live" | "paused";

export type LimitAction = "block" | "queue" | "notify";

export interface RateCardEndpoint {
  id: string;
  path: string;
  unit: string;
  pricePerUnit: number;
  status: EndpointStatus;
}

export interface AgentAccount {
  id: string;
  label: string;
  owner: string;
  funded: number;
  spent24h: number;
  balance: number;
  status: AgentStatus;
  createdAt: string;
  withdrawalsRestricted: true;
}

export interface Receipt {
  id: string;
  txHash: string;
  endpoint: string;
  agentId: string;
  amount: number;
  time: string;
  settle: SettleStatus;
  query?: string;
  provider?: string;
  invoiceId?: string;
}

export interface InvoiceLine {
  endpoint: string;
  units: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  counterparty: string;
  agentId: string;
  amount: number;
  calls: number;
  issued: string;
  due: string;
  status: InvoiceStatus;
  lines: InvoiceLine[];
  takeFee: number;
}

export interface LimitRule {
  id: string;
  scope: string;
  cap: number;
  used: number;
  window: string;
  action: LimitAction;
}

export interface LedgerSnapshot {
  version: 1;
  updatedAt: string;
  takeRate: number;
  dailyCapUsdc: number;
  settleAsset: "USDC";
  settleChainLabel: string;
  endpoints: RateCardEndpoint[];
  agents: AgentAccount[];
  receipts: Receipt[];
  invoices: Invoice[];
  limits: LimitRule[];
  /** Rolling spend windows keyed by agentId → ISO day → USDC */
  dailySpend: Record<string, Record<string, number>>;
  workspaceDailySpend: Record<string, number>;
}

export interface ResearchResult {
  query: string;
  answer: string;
  sources: Array<{ title: string; url: string; snippet?: string }>;
  /** Live TinyFish Fetch excerpts for top source URLs. */
  pages: Array<{ url: string; title: string | null; excerpt: string }>;
  providers: string[];
  receiptId: string;
  amount: number;
}
