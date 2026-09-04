/**
 * Durable METER ledger — single shared truth for usage, pays, fails, limits.
 * Prefers atomic JSON file when Node fs is available; otherwise process-memory
 * (Cloudflare Workers). Never seeds fake demo receipts.
 */

import { getEnv } from "./env";
import type {
  AgentAccount,
  Invoice,
  LedgerSnapshot,
  LimitRule,
  RateCardEndpoint,
  Receipt,
} from "./types";

const DEFAULT_ENDPOINTS: RateCardEndpoint[] = [
  {
    id: "ep_research",
    path: "/research",
    unit: "query",
    pricePerUnit: 0.02,
    status: "live",
  },
  {
    id: "ep_embed",
    path: "/embed",
    unit: "1k tokens",
    pricePerUnit: 0.004,
    status: "paused",
  },
  {
    id: "ep_onchain",
    path: "/onchain/scan",
    unit: "address",
    pricePerUnit: 0.05,
    status: "paused",
  },
];

type FsMod = {
  promises: {
    mkdir: (path: string, opts: { recursive: boolean }) => Promise<unknown>;
    readFile: (path: string, enc: string) => Promise<string>;
    writeFile: (path: string, data: string, enc: string) => Promise<void>;
    rename: (from: string, to: string) => Promise<void>;
  };
};

let fsMod: FsMod | null | undefined;
let pathJoin: ((...parts: string[]) => string) | null = null;
let memoryLedger: LedgerSnapshot | null = null;

async function tryFs(): Promise<FsMod | null> {
  if (fsMod !== undefined) return fsMod;
  try {
    const fs = (await import("node:fs")) as unknown as FsMod;
    const path = await import("node:path");
    // Probe access
    await fs.promises.mkdir("data", { recursive: true });
    pathJoin = (...parts: string[]) => path.resolve(...parts);
    fsMod = fs;
    return fs;
  } catch {
    fsMod = null;
    return null;
  }
}

function emptyLedger(): LedgerSnapshot {
  const env = getEnv();
  const research = DEFAULT_ENDPOINTS.map((e) =>
    e.id === "ep_research"
      ? { ...e, pricePerUnit: env.METER_RESEARCH_PRICE_USDC }
      : e,
  );
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    takeRate: env.METER_TAKE_RATE,
    dailyCapUsdc: env.METER_DAILY_CAP_USDC,
    settleAsset: "USDC",
    settleChainLabel: env.METER_PAY_TO
      ? env.METER_SETTLE_NETWORK
      : "METER prepaid subaccount (Agent OS sandbox pattern)",
    endpoints: research,
    agents: [],
    receipts: [],
    invoices: [],
    limits: [
      {
        id: "lm_daily",
        scope: "Workspace daily spend",
        cap: env.METER_DAILY_CAP_USDC,
        used: 0,
        window: "24h",
        action: "block",
      },
      {
        id: "lm_call",
        scope: "Single call ceiling",
        cap: Math.max(env.METER_RESEARCH_PRICE_USDC * 5, 0.25),
        used: 0,
        window: "per call",
        action: "block",
      },
    ],
    dailySpend: {},
    workspaceDailySpend: {},
  };
}

let lock: Promise<void> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function ledgerPath(): string {
  if (!pathJoin) return getEnv().METER_LEDGER_PATH;
  return pathJoin(process.cwd(), getEnv().METER_LEDGER_PATH);
}

async function readRaw(): Promise<LedgerSnapshot> {
  const fs = await tryFs();
  if (!fs) {
    memoryLedger ??= emptyLedger();
    return structuredClone(memoryLedger);
  }
  const file = ledgerPath();
  try {
    const raw = await fs.promises.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as LedgerSnapshot;
    if (parsed.version !== 1) {
      throw new Error(`Unsupported ledger version: ${String(parsed.version)}`);
    }
    return parsed;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return emptyLedger();
    throw err;
  }
}

async function writeRaw(snapshot: LedgerSnapshot): Promise<void> {
  const next = { ...snapshot, updatedAt: new Date().toISOString() };
  const fs = await tryFs();
  if (!fs) {
    memoryLedger = structuredClone(next);
    return;
  }
  const file = ledgerPath();
  const dir = file.includes("/") ? file.slice(0, file.lastIndexOf("/")) : "data";
  await fs.promises.mkdir(dir, { recursive: true });
  const tmp = `${file}.${Date.now()}.tmp`;
  await fs.promises.writeFile(tmp, JSON.stringify(next, null, 2), "utf8");
  await fs.promises.rename(tmp, file);
}

export async function getLedger(): Promise<LedgerSnapshot> {
  return withLock(async () => readRaw());
}

export async function mutateLedger(
  mutator: (ledger: LedgerSnapshot) => LedgerSnapshot | void,
): Promise<LedgerSnapshot> {
  return withLock(async () => {
    const current = await readRaw();
    const maybe = mutator(current) ?? current;
    await writeRaw(maybe);
    return maybe;
  });
}

export function utcDayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export async function fundAgent(input: {
  id: string;
  label: string;
  owner: string;
  amount: number;
}): Promise<AgentAccount> {
  if (!(input.amount > 0)) {
    throw new Error("Fund amount must be positive");
  }
  let created: AgentAccount | undefined;
  await mutateLedger((ledger) => {
    const existing = ledger.agents.find((a) => a.id === input.id);
    if (existing) {
      existing.funded += input.amount;
      existing.balance += input.amount;
      if (existing.status === "suspended" && existing.balance > 0) {
        existing.status = "active";
      }
      created = existing;
      return;
    }
    const agent: AgentAccount = {
      id: input.id,
      label: input.label,
      owner: input.owner,
      funded: input.amount,
      spent24h: 0,
      balance: input.amount,
      status: "active",
      createdAt: new Date().toISOString(),
      withdrawalsRestricted: true,
    };
    ledger.agents.push(agent);
    created = agent;
  });
  if (!created) throw new Error("Failed to fund agent");
  return created;
}

export async function appendReceipt(receipt: Receipt): Promise<void> {
  await mutateLedger((ledger) => {
    ledger.receipts.unshift(receipt);
    if (ledger.receipts.length > 5000) {
      ledger.receipts.length = 5000;
    }
  });
}

export async function appendInvoice(invoice: Invoice): Promise<void> {
  await mutateLedger((ledger) => {
    ledger.invoices.unshift(invoice);
  });
}

export async function refreshLimitUsage(): Promise<LimitRule[]> {
  const ledger = await getLedger();
  const day = utcDayKey();
  const workspaceUsed = ledger.workspaceDailySpend[day] ?? 0;
  return ledger.limits.map((rule) => {
    if (rule.id === "lm_daily") {
      return { ...rule, used: Number(workspaceUsed.toFixed(6)) };
    }
    return rule;
  });
}

export { DEFAULT_ENDPOINTS };
