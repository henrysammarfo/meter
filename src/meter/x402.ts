/**
 * x402 challenge + optional facilitator verify/settle.
 * Protocol headers per https://docs.x402.org (PAYMENT-REQUIRED / PAYMENT-SIGNATURE / PAYMENT-RESPONSE).
 */

import { binanceConfigured, binanceFacilitatorSettle } from "./clients/binance";
import { getEnv, MeterLiveError } from "./env";

export interface PaymentAccept {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra?: Record<string, unknown>;
}

export interface PaymentRequiredBody {
  x402Version: number;
  accepts: PaymentAccept[];
  error?: string;
}

export function usdcToAtomic(usdc: number): string {
  return String(Math.round(usdc * 1_000_000));
}

export function buildPaymentRequired(input: {
  resourceUrl: string;
  priceUsdc: number;
  description: string;
}): PaymentRequiredBody {
  const env = getEnv();
  const accepts: PaymentAccept[] = [
    {
      scheme: "meter-prepaid",
      network: "meter-agent-os-sandbox",
      maxAmountRequired: usdcToAtomic(input.priceUsdc),
      resource: input.resourceUrl,
      description: input.description,
      mimeType: "application/json",
      payTo: "meter:ledger",
      maxTimeoutSeconds: 120,
      asset: "USDC",
      extra: {
        instructions:
          "Fund a METER subaccount then retry with headers X-Meter-Agent-Id and X-Meter-Payment: prepaid",
        dailyCapUsdc: env.METER_DAILY_CAP_USDC,
        takeRate: env.METER_TAKE_RATE,
      },
    },
  ];

  if (env.METER_PAY_TO && env.METER_USDC_ASSET) {
    accepts.push({
      scheme: "exact",
      network: env.METER_SETTLE_NETWORK,
      maxAmountRequired: usdcToAtomic(input.priceUsdc),
      resource: input.resourceUrl,
      description: input.description,
      mimeType: "application/json",
      payTo: env.METER_PAY_TO,
      maxTimeoutSeconds: 60,
      asset: env.METER_USDC_ASSET,
      extra: {
        facilitator: env.BINANCE_X402_FACILITATOR_URL ?? env.METER_FACILITATOR_URL,
        binanceAgentOs: binanceConfigured(),
      },
    });
  }

  return { x402Version: 1, accepts };
}

export function encodePaymentRequired(body: PaymentRequiredBody): string {
  return Buffer.from(JSON.stringify(body), "utf8").toString("base64");
}

export function decodePaymentSignature(header: string | null): unknown | null {
  if (!header) return null;
  try {
    const json = Buffer.from(header, "base64").toString("utf8");
    return JSON.parse(json) as unknown;
  } catch {
    throw new MeterLiveError("X402_SIGNATURE_PARSE", "Invalid PAYMENT-SIGNATURE header", 400);
  }
}

/**
 * Verify + settle via facilitator when on-chain path is configured.
 * Returns settlement payload or throws. Never fakes a tx hash.
 */
export async function facilitatorSettle(paymentPayload: unknown): Promise<{
  success: boolean;
  transaction: string;
  network: string;
  payer?: string;
}> {
  const env = getEnv();
  if (!env.METER_PAY_TO || !env.METER_USDC_ASSET) {
    throw new MeterLiveError(
      "X402_ONCHAIN_UNCONFIGURED",
      "On-chain x402 settle requires METER_PAY_TO and METER_USDC_ASSET. Prepaid subaccount path remains available.",
      501,
    );
  }

  // Prefer Binance Agent OS facilitator when fully keyed — never invent a tx.
  if (binanceConfigured()) {
    return binanceFacilitatorSettle(paymentPayload);
  }

  const base = env.METER_FACILITATOR_URL;
  const verifyRes = await fetch(`${base.replace(/\/$/, "")}/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      x402Version: 1,
      paymentPayload,
    }),
  });
  const verifyText = await verifyRes.text();
  if (!verifyRes.ok) {
    throw new MeterLiveError("X402_VERIFY", `Facilitator verify failed HTTP ${verifyRes.status}`, 402, verifyText.slice(0, 600));
  }

  const settleRes = await fetch(`${base.replace(/\/$/, "")}/settle`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      x402Version: 1,
      paymentPayload,
    }),
  });
  const settleText = await settleRes.text();
  if (!settleRes.ok) {
    throw new MeterLiveError("X402_SETTLE", `Facilitator settle failed HTTP ${settleRes.status}`, 402, settleText.slice(0, 600));
  }
  const settled = JSON.parse(settleText) as {
    success?: boolean;
    transaction?: string;
    network?: string;
    payer?: string;
  };
  if (!settled.success || !settled.transaction) {
    throw new MeterLiveError("X402_SETTLE_SHAPE", "Facilitator settle missing transaction", 402, settled);
  }
  return {
    success: true,
    transaction: settled.transaction,
    network: settled.network ?? env.METER_SETTLE_NETWORK,
    ...(settled.payer ? { payer: settled.payer } : {}),
  };
}

export function paymentRequiredResponse(
  body: PaymentRequiredBody,
  extraHeaders?: HeadersInit,
): Response {
  const encoded = encodePaymentRequired(body);
  const headers = new Headers(extraHeaders);
  headers.set("content-type", "application/json");
  headers.set("PAYMENT-REQUIRED", encoded);
  headers.set("Cache-Control", "no-store");
  return new Response(
    JSON.stringify({
      error: "payment_required",
      message: "Payment required to access this metered resource",
      paymentRequired: body,
    }),
    { status: 402, headers },
  );
}
