/**
 * Operator auth + agent bearer tokens + per-agent rate limits + idempotency + CORS.
 * Fail closed when METER_OPERATOR_KEY is configured or production mode is on.
 */

import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { getEnv, isProductionMode, MeterLiveError } from "./env";

const idempotencyCache = new Map<
  string,
  { expires: number; status: number; body: string; headers: Record<string, string> }
>();
const rateBuckets = new Map<string, { count: number; reset: number }>();
const demoSeedBuckets = new Map<string, { count: number; reset: number }>();

const IDEMPOTENCY_TTL_MS = 15 * 60 * 1000;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_PER_AGENT = 120;
const DEMO_SEED_WINDOW_MS = 60 * 60 * 1000;
const DEMO_SEED_MAX = 30;

export function hashAgentToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function mintAgentToken(): { token: string; tokenHash: string } {
  const token = `mt_${randomBytes(24).toString("base64url")}`;
  return { token, tokenHash: hashAgentToken(token) };
}

export function tokensEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function requireOperator(request: Request): void {
  const env = getEnv();
  if (!env.METER_OPERATOR_KEY) {
    if (isProductionMode()) {
      throw new MeterLiveError(
        "OPERATOR_KEY_REQUIRED",
        "Production mode requires METER_OPERATOR_KEY. Set it in .env — no open mutation path.",
        503,
      );
    }
    // Local/dev without key: allowed until production lock.
    return;
  }
  const header =
    request.headers.get("x-meter-operator-key") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!header || !tokensEqual(header, env.METER_OPERATOR_KEY)) {
    throw new MeterLiveError(
      "OPERATOR_UNAUTHORIZED",
      "Operator key required for this mutation. Pass X-Meter-Operator-Key.",
      401,
    );
  }
}

export function isOperatorAuthorized(request: Request): boolean {
  try {
    requireOperator(request);
    return true;
  } catch {
    return false;
  }
}

export function requestId(request: Request): string {
  return request.headers.get("x-request-id") ?? randomUUID();
}

export function assertAgentRateLimit(agentId: string): void {
  const now = Date.now();
  const bucket = rateBuckets.get(agentId);
  if (!bucket || bucket.reset <= now) {
    rateBuckets.set(agentId, { count: 1, reset: now + RATE_WINDOW_MS });
    return;
  }
  bucket.count += 1;
  if (bucket.count > RATE_MAX_PER_AGENT) {
    throw new MeterLiveError(
      "RATE_LIMITED",
      `Agent ${agentId} exceeded ${RATE_MAX_PER_AGENT} requests / minute`,
      429,
      { resetAt: new Date(bucket.reset).toISOString() },
    );
  }
}

/** Rate-limit public demo seed / demo invoice by client fingerprint. */
export function assertDemoSeedRateLimit(request: Request): void {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "local";
  const now = Date.now();
  const bucket = demoSeedBuckets.get(ip);
  if (!bucket || bucket.reset <= now) {
    demoSeedBuckets.set(ip, { count: 1, reset: now + DEMO_SEED_WINDOW_MS });
    return;
  }
  bucket.count += 1;
  if (bucket.count > DEMO_SEED_MAX) {
    throw new MeterLiveError(
      "DEMO_RATE_LIMITED",
      "Demo seed rate limit exceeded. Wait and retry, or fund via operator API.",
      429,
    );
  }
}

export function idempotencyKey(request: Request): string | null {
  return request.headers.get("idempotency-key") ?? request.headers.get("x-idempotency-key");
}

export function readIdempotent(key: string): Response | null {
  const hit = idempotencyCache.get(key);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    idempotencyCache.delete(key);
    return null;
  }
  return new Response(hit.body, {
    status: hit.status,
    headers: { ...hit.headers, "X-Idempotent-Replay": "true" },
  });
}

export async function storeIdempotent(key: string, response: Response): Promise<Response> {
  const body = await response.clone().text();
  const headers: Record<string, string> = {};
  response.headers.forEach((v, k) => {
    headers[k] = v;
  });
  idempotencyCache.set(key, {
    expires: Date.now() + IDEMPOTENCY_TTL_MS,
    status: response.status,
    body,
    headers,
  });
  if (idempotencyCache.size > 2000) {
    const first = idempotencyCache.keys().next().value;
    if (first) idempotencyCache.delete(first);
  }
  return new Response(body, { status: response.status, headers: response.headers });
}

function corsOriginAllowed(origin: string | null): string | null {
  if (!origin) return null;
  const env = getEnv();
  const raw = env.METER_CORS_ORIGINS?.trim();
  if (!raw || raw === "*") return origin;
  const allowed = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (allowed.includes("*") || allowed.includes(origin)) return origin;
  return null;
}

export function corsHeaders(request: Request): Headers {
  const origin = request.headers.get("origin");
  const allowed = corsOriginAllowed(origin);
  const headers = new Headers();
  if (allowed) {
    headers.set("Access-Control-Allow-Origin", allowed);
    headers.set("Vary", "Origin");
  } else if (!origin) {
    headers.set("Access-Control-Allow-Origin", "*");
  }
  headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Meter-Agent-Id, X-Meter-Agent-Token, X-Meter-Payment, X-Meter-Operator-Key, PAYMENT-SIGNATURE, Idempotency-Key, X-Request-Id",
  );
  headers.set(
    "Access-Control-Expose-Headers",
    "PAYMENT-REQUIRED, PAYMENT-RESPONSE, X-Meter-Receipt, X-Meter-Amount",
  );
  headers.set("Access-Control-Max-Age", "86400");
  return headers;
}

export function hashPayload(parts: unknown[]): string {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 24);
}

/** Strip secrets before returning ledger agents to clients. */
export function publicAgent<T extends { tokenHash?: string }>(agent: T): Omit<T, "tokenHash"> {
  const { tokenHash: _omit, ...rest } = agent;
  return rest;
}
