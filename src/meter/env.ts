/**
 * Environment contracts for METER.
 * Secrets never leave process.env. Missing live keys fail closed (no mocks).
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

/**
 * Load gitignored .env once. Never logs secret values.
 * Force-overrides AgentRouter keys from file so stale process env cannot win.
 */
function loadDotEnv(): void {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "grounds/.env"),
  ];
  const forceOverride = new Set([
    "AGENT_ROUTER_API_KEY",
    "AGENTROUTER_API_KEY",
    "AGENT_ROUTER_BASE",
    "AGENT_ROUTER_ANTHROPIC_BASE",
    "AGENTROUTER_BASE_URL",
    "AGENTROUTER_MODEL",
    "AGENT_ROUTER_CLAUDE_MODEL",
    "AGENT_ROUTER_GPT_MODEL",
    "AGENT_ROUTER_DEEPSEEK_MODEL",
    "ANTHROPIC_AUTH_TOKEN",
    "ANTHROPIC_API_KEY",
    "METER_LLM_PROVIDER",
  ]);

  for (const file of candidates) {
    if (!existsSync(file)) continue;
    try {
      const load = (process as NodeJS.Process & { loadEnvFile?: (path: string) => void })
        .loadEnvFile;
      load?.(file);
    } catch {
      /* already loaded or unsupported */
    }
    try {
      for (const line of readFileSync(file, "utf8").split("\n")) {
        if (!line || line.startsWith("#") || !line.includes("=")) continue;
        const i = line.indexOf("=");
        const key = line.slice(0, i).trim();
        const value = line.slice(i + 1).trim();
        if (!forceOverride.has(key)) continue;
        if (value) process.env[key] = value;
      }
    } catch {
      /* ignore */
    }
  }
}

loadDotEnv();

/**
 * AFTERCUT base: https://agentrouter.org (no /v1 suffix required here).
 * Do NOT remap to co.agentrouter.org — WAF bypass is Claude Code wire headers.
 */
const DEFAULT_AGENTROUTER_BASE = "https://agentrouter.org";

function normalizeAgentRouterBase(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  try {
    const u = new URL(trimmed);
    // Strip trailing /v1 so clients can append /v1/messages or /v1/chat/completions.
    if (u.pathname.replace(/\/+$/, "") === "/v1") {
      return `${u.origin}`;
    }
    return trimmed.replace(/\/v1$/i, "");
  } catch {
    return DEFAULT_AGENTROUTER_BASE;
  }
}

function emptyToUndef(v: unknown): unknown {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "string" && v.trim() === "") return undefined;
  return v;
}

const optionalNonEmpty = z.preprocess(emptyToUndef, z.string().min(1).optional());

const EnvSchema = z.object({
  TAVILY_API_KEY: optionalNonEmpty,
  TINYFISH_API_KEY: optionalNonEmpty,
  /** Prefer AGENT_ROUTER_API_KEY; AGENTROUTER_API_KEY kept for repo compat. */
  AGENT_ROUTER_API_KEY: optionalNonEmpty,
  AGENTROUTER_API_KEY: optionalNonEmpty,
  ANTHROPIC_AUTH_TOKEN: optionalNonEmpty,
  ANTHROPIC_API_KEY: optionalNonEmpty,
  /**
   * AFTERCUT gateway host. Default https://agentrouter.org.
   * WAF is bypassed with Claude Code wire headers — not by switching host.
   */
  AGENT_ROUTER_BASE: z.preprocess(emptyToUndef, z.string().url().optional()),
  AGENT_ROUTER_ANTHROPIC_BASE: z.preprocess(emptyToUndef, z.string().url().optional()),
  AGENTROUTER_BASE_URL: z.preprocess(
    emptyToUndef,
    z.string().url().default(DEFAULT_AGENTROUTER_BASE),
  ),
  AGENTROUTER_MODEL: z.preprocess(emptyToUndef, z.string().optional()),
  AGENT_ROUTER_CLAUDE_MODEL: z.preprocess(emptyToUndef, z.string().optional()),
  AGENT_ROUTER_GPT_MODEL: z.preprocess(emptyToUndef, z.string().optional()),
  AGENT_ROUTER_DEEPSEEK_MODEL: z.preprocess(emptyToUndef, z.string().optional()),
  VENICE_API_KEY: optionalNonEmpty,
  VENICE_BASE_URL: z.preprocess(emptyToUndef, z.string().url().optional()),
  VENICE_MODEL: z.preprocess(emptyToUndef, z.string().optional()),
  /** Explicit LLM vendor — never auto-swaps. */
  METER_LLM_PROVIDER: z.preprocess(
    emptyToUndef,
    z.enum(["agentrouter", "venice"]).optional(),
  ),
  METER_TAKE_RATE: z.coerce.number().min(0).max(0.2).default(0.009),
  METER_DAILY_CAP_USDC: z.coerce.number().positive().default(20),
  METER_RESEARCH_PRICE_USDC: z.coerce.number().positive().default(0.02),
  METER_LEDGER_PATH: z.preprocess(
    emptyToUndef,
    z.string().default("data/ledger.json"),
  ),
  METER_FACILITATOR_URL: z.preprocess(
    emptyToUndef,
    z.string().url().default("https://x402.org/facilitator"),
  ),
  METER_PAY_TO: optionalNonEmpty,
  METER_SETTLE_NETWORK: z.preprocess(
    emptyToUndef,
    z.string().default("base-sepolia"),
  ),
  METER_USDC_ASSET: optionalNonEmpty,
  BINANCE_AGENT_OS_API_KEY: optionalNonEmpty,
  BINANCE_X402_FACILITATOR_URL: optionalNonEmpty,
  /** When set, mutating operator routes require X-Meter-Operator-Key. */
  METER_OPERATOR_KEY: optionalNonEmpty,
  /**
   * Production lock: require operator key for fund/invoice mutations.
   * Also inferred when NODE_ENV=production.
   */
  METER_PRODUCTION: z.preprocess((v) => {
    if (v === undefined || v === null || v === "") return undefined;
    if (typeof v === "boolean") return v;
    const s = String(v).toLowerCase();
    if (["1", "true", "yes", "on"].includes(s)) return true;
    if (["0", "false", "no", "off"].includes(s)) return false;
    return v;
  }, z.boolean().optional()),
});

export type MeterEnv = z.infer<typeof EnvSchema>;

let cached: MeterEnv | null = null;

export function getEnv(): MeterEnv {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid METER environment: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
    );
  }
  const baseRaw =
    parsed.data.AGENT_ROUTER_BASE ||
    parsed.data.AGENT_ROUTER_ANTHROPIC_BASE ||
    parsed.data.AGENTROUTER_BASE_URL ||
    DEFAULT_AGENTROUTER_BASE;
  cached = {
    ...parsed.data,
    AGENTROUTER_BASE_URL: normalizeAgentRouterBase(baseRaw),
  };
  return cached;
}

export function isProductionMode(): boolean {
  const env = getEnv();
  if (env.METER_PRODUCTION === true) return true;
  if (env.METER_PRODUCTION === false) return false;
  return process.env["NODE_ENV"] === "production";
}

/** Require a named secret. Throws — never substitutes a demo key. */
export function requireSecret(
  key: keyof MeterEnv,
  purpose: string,
): string {
  const env = getEnv();
  const value = env[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new MeterConfigError(
      `Missing ${String(key)} required for ${purpose}. Set it in .env (gitignored). No mock path exists.`,
    );
  }
  return value;
}

export class MeterConfigError extends Error {
  readonly code = "METER_CONFIG" as const;
  constructor(message: string) {
    super(message);
    this.name = "MeterConfigError";
  }
}

export class MeterLiveError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: string, message: string, status = 502, details?: unknown) {
    super(message);
    this.name = "MeterLiveError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
