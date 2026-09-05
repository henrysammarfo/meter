/**
 * Operator auth + per-agent rate limits + idempotency for mutating APIs.
 * Fail closed when METER_OPERATOR_KEY is configured.
 */

import { createHash, randomUUID } from "node:crypto";
import { getEnv, isProductionMode, MeterLiveError } from "./env";

const idempotencyCache = new Map<string, { expires: number; status: number; body: string; headers: Record<string, string> }>();
const rateBuckets = new Map<string, { count: number; reset: number }>();

const IDEMPOTENCY_TTL_MS = 15 * 60 * 1000;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_PER_AGENT = 120;

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
  if (!header || header !== env.METER_OPERATOR_KEY) {
    throw new MeterLiveError(
      "OPERATOR_UNAUTHORIZED",
      "Operator key required for this mutation. Pass X-Meter-Operator-Key.",
      401,
    );
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
  // Cap map size
  if (idempotencyCache.size > 2000) {
    const first = idempotencyCache.keys().next().value;
    if (first) idempotencyCache.delete(first);
  }
  return new Response(body, { status: response.status, headers: response.headers });
}

export function corsHeaders(request: Request): Headers {
  const origin = request.headers.get("origin") ?? "*";
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Meter-Agent-Id, X-Meter-Payment, X-Meter-Operator-Key, PAYMENT-SIGNATURE, Idempotency-Key",
  );
  headers.set("Access-Control-Expose-Headers", "PAYMENT-REQUIRED, PAYMENT-RESPONSE, X-Meter-Receipt, X-Meter-Amount");
  headers.set("Access-Control-Max-Age", "86400");
  if (origin !== "*") headers.set("Vary", "Origin");
  return headers;
}

export function hashPayload(parts: unknown[]): string {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 24);
}
