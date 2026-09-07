/**
 * Binance Agent OS / x402 facilitator client.
 * Fail closed until BINANCE_AGENT_OS_API_KEY (+ facilitator URL) are set.
 * Never invents settlement hashes.
 */

import { getEnv, MeterLiveError, requireSecret } from "../env";

export function binanceConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.BINANCE_AGENT_OS_API_KEY && env.BINANCE_X402_FACILITATOR_URL);
}

export async function binanceFacilitatorVerify(paymentPayload: unknown): Promise<unknown> {
  const env = getEnv();
  const key = requireSecret("BINANCE_AGENT_OS_API_KEY", "Binance Agent OS settle");
  const base = requireSecret("BINANCE_X402_FACILITATOR_URL", "Binance x402 facilitator");

  const res = await fetch(`${base.replace(/\/$/, "")}/verify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "content-type": "application/json",
      Accept: "application/json",
      "X-Binance-Agent-OS": "METER",
    },
    body: JSON.stringify({ x402Version: 1, paymentPayload }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new MeterLiveError(
      "BINANCE_VERIFY",
      `Binance facilitator verify HTTP ${res.status}`,
      402,
      text.slice(0, 800),
    );
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new MeterLiveError("BINANCE_VERIFY_PARSE", "Non-JSON from Binance verify", 502, text.slice(0, 400));
  }
}

export async function binanceFacilitatorSettle(paymentPayload: unknown): Promise<{
  success: boolean;
  transaction: string;
  network: string;
  payer?: string;
}> {
  const env = getEnv();
  const key = requireSecret("BINANCE_AGENT_OS_API_KEY", "Binance Agent OS settle");
  const base = requireSecret("BINANCE_X402_FACILITATOR_URL", "Binance x402 facilitator");

  const res = await fetch(`${base.replace(/\/$/, "")}/settle`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "content-type": "application/json",
      Accept: "application/json",
      "X-Binance-Agent-OS": "METER",
    },
    body: JSON.stringify({ x402Version: 1, paymentPayload }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new MeterLiveError(
      "BINANCE_SETTLE",
      `Binance facilitator settle HTTP ${res.status}`,
      402,
      text.slice(0, 800),
    );
  }
  let settled: {
    success?: boolean;
    transaction?: string;
    network?: string;
    payer?: string;
  };
  try {
    settled = JSON.parse(text) as typeof settled;
  } catch {
    throw new MeterLiveError("BINANCE_SETTLE_PARSE", "Non-JSON from Binance settle", 502, text.slice(0, 400));
  }
  if (!settled.success || !settled.transaction) {
    throw new MeterLiveError(
      "BINANCE_SETTLE_SHAPE",
      "Binance settle missing success/transaction — refusing to invent a hash",
      402,
      settled,
    );
  }
  return {
    success: true,
    transaction: settled.transaction,
    network: settled.network ?? env.METER_SETTLE_NETWORK,
    ...(settled.payer ? { payer: settled.payer } : {}),
  };
}
