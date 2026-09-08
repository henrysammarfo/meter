/**
 * Shared METER /api/v1 client — attaches operator + agent credentials from the
 * browser vault (localStorage). Never invents responses; surfaces HTTP errors.
 */

import { getAgentToken, getOperatorKey } from "./meter-workspace";

export type MeterApiErrorBody = {
  error?: string;
  message?: string;
  code?: string;
};

export class MeterApiError extends Error {
  status: number;
  body: MeterApiErrorBody;

  constructor(status: number, body: MeterApiErrorBody, fallback: string) {
    super(body.message ?? body.error ?? fallback);
    this.name = "MeterApiError";
    this.status = status;
    this.body = body;
  }
}

export type MeterFetchOptions = {
  method?: string;
  body?: unknown;
  /** Attach X-Meter-Operator-Key from vault when present. */
  operator?: boolean;
  /** Attach agent id + token headers (token from vault for that agent). */
  agentId?: string;
  agentToken?: string;
  payment?: "prepaid" | "x402";
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export async function meterFetch<T = unknown>(
  path: string,
  opts: MeterFetchOptions = {},
): Promise<{ status: number; data: T }> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.headers ?? {}),
  };

  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (opts.operator) {
    const key = getOperatorKey();
    if (key) headers["X-Meter-Operator-Key"] = key;
  }

  if (opts.agentId) {
    headers["X-Meter-Agent-Id"] = opts.agentId;
    const token = opts.agentToken ?? getAgentToken(opts.agentId);
    if (token) headers["X-Meter-Agent-Token"] = token;
  }

  if (opts.payment) {
    headers["X-Meter-Payment"] = opts.payment;
  }

  const init: RequestInit = {
    method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
    headers,
  };
  if (opts.body !== undefined) init.body = JSON.stringify(opts.body);
  if (opts.signal) init.signal = opts.signal;

  const res = await fetch(path.startsWith("/") ? path : `/api/v1/${path}`, init);

  const text = await res.text();
  let data: T | MeterApiErrorBody = {} as T;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      data = { message: text.slice(0, 400) };
    }
  }

  if (!res.ok) {
    throw new MeterApiError(
      res.status,
      data as MeterApiErrorBody,
      `HTTP ${res.status} ${path}`,
    );
  }

  return { status: res.status, data: data as T };
}

export async function joinWaitlist(email: string, source: string) {
  return meterFetch<{ ok: boolean; total?: number; message?: string }>("/api/v1/waitlist", {
    method: "POST",
    body: { email: email.trim(), source },
  });
}

export async function fetchHealth(deep = false) {
  const q = deep ? "?deep=1" : "";
  return meterFetch<MeterHealth>(`/api/v1/health${q}`);
}

export type ProbeStatus = {
  configured: boolean;
  reachable: boolean | null;
  latencyMs: number | null;
  error: string | null;
  provider?: string | null;
  url?: string;
  required?: boolean;
};

export type SettleRailStatus = {
  id: string;
  live: boolean;
  note: string;
};

export type MeterHealth = {
  ok: boolean;
  service: string;
  track: string;
  doctrine: string;
  dailyCapUsdc: number;
  researchPriceUsdc: number;
  takeRate: number;
  waitlistCount?: number;
  live: {
    tavily: ProbeStatus;
    tinyfish: ProbeStatus;
    llm: ProbeStatus;
    onchainX402: { configured: boolean };
    binanceAgentOs: { configured: boolean };
    operatorAuth: { configured: boolean; required: boolean };
    settleRails: SettleRailStatus[];
    openFacilitator: ProbeStatus;
  };
};

export function probeLabel(probe: ProbeStatus | { configured: boolean }): string {
  if (!("reachable" in probe)) {
    return probe.configured ? "configured" : "missing";
  }
  if (!probe.configured) return "missing";
  if (probe.reachable === true) return "live";
  if (probe.reachable === false) return "down";
  return "configured";
}

export async function markInvoicePaid(id: string) {
  return meterFetch(`/api/v1/invoices/${encodeURIComponent(id)}/pay`, {
    method: "POST",
    operator: true,
  });
}

/** Public demo path — marks agent_demo_7c1 invoices paid without operator key. */
export async function markDemoInvoicePaid(id: string) {
  return meterFetch(`/api/v1/demo/invoice/pay`, {
    method: "POST",
    body: { id },
  });
}

export async function issueInvoice(agentId: string) {
  return meterFetch("/api/v1/invoices", {
    method: "POST",
    operator: true,
    body: { agentId },
  });
}

export async function fundSubaccount(input: {
  id: string;
  amount: number;
  label?: string;
}) {
  return meterFetch<{
    agent: { id: string; balance: number; label?: string };
    agentToken: string;
    tokenRotated?: boolean;
  }>("/api/v1/subaccounts", {
    method: "POST",
    operator: true,
    body: input,
  });
}

export type ResearchQuote = {
  endpoint: string;
  priceUsdc: number;
  agentId: string;
  balance: number;
  workspaceUsed: number;
  workspaceCap: number;
  workspaceRemaining: number;
  canAfford: boolean;
  underCap: boolean;
  next: string;
  message: string;
};

export async function quoteResearch(agentId: string, agentToken?: string) {
  return meterFetch<ResearchQuote>("/api/v1/research/quote", {
    agentId,
    ...(agentToken ? { agentToken } : {}),
  });
}

export async function runPrepaidResearch(agentId: string, q: string, agentToken?: string) {
  const path = `/api/v1/research?q=${encodeURIComponent(q)}`;
  return meterFetch<{
    receiptId?: string;
    providers?: string[];
    sources?: unknown[];
    error?: string;
    message?: string;
  }>(path, {
    agentId,
    ...(agentToken ? { agentToken } : {}),
    payment: "prepaid",
  });
}

export async function demoDrain(agentToken: string) {
  return meterFetch<{ agentId: string; balance: number; note?: string }>("/api/v1/demo/drain", {
    method: "POST",
    headers: { "X-Meter-Agent-Token": agentToken },
  });
}
