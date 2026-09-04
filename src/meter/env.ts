/**
 * Environment contracts for METER.
 * Secrets never leave process.env. Missing live keys fail closed (no mocks).
 */

import { existsSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

/** Load gitignored .env once (Node 20.12+ loadEnvFile). Never logs secret values. */
function loadDotEnv(): void {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "grounds/.env"),
  ];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    try {
      const load = (process as NodeJS.Process & { loadEnvFile?: (path: string) => void }).loadEnvFile;
      load?.(file);
    } catch {
      /* already loaded or unsupported */
    }
  }
}

loadDotEnv();

function emptyToUndef(v: unknown): unknown {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "string" && v.trim() === "") return undefined;
  return v;
}

const optionalNonEmpty = z.preprocess(emptyToUndef, z.string().min(1).optional());

const EnvSchema = z.object({
  TAVILY_API_KEY: optionalNonEmpty,
  TINYFISH_API_KEY: optionalNonEmpty,
  AGENTROUTER_API_KEY: optionalNonEmpty,
  AGENTROUTER_BASE_URL: z.preprocess(
    emptyToUndef,
    z.string().url().default("https://agentrouter.org/v1"),
  ),
  AGENTROUTER_MODEL: z.preprocess(
    emptyToUndef,
    z.string().default("gpt-4o-mini"),
  ),
  VENICE_API_KEY: optionalNonEmpty,
  VENICE_BASE_URL: z.preprocess(emptyToUndef, z.string().url().optional()),
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
  cached = parsed.data;
  return cached;
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
