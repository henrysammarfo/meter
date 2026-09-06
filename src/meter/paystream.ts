/**
 * PAYSTREAM — authorize a metered call against limits + prepaid balance or x402 settle.
 * Caps and balance mutate under a single ledger lock. Failed work must call refundPrepaid.
 */

import { randomUUID } from "node:crypto";
import { MeterLiveError } from "./env";
import {
  appendReceipt,
  getLedger,
  mutateLedger,
  utcDayKey,
} from "./ledger";
import { hashAgentToken, tokensEqual } from "./security";
import type { LedgerSnapshot, Receipt, SettleStatus } from "./types";
import {
  decodePaymentSignature,
  extractPaymentAmountUsdc,
  extractPaymentResource,
  facilitatorSettle,
} from "./x402";

export interface PayAuthorization {
  agentId: string;
  amount: number;
  settle: SettleStatus;
  txHash: string;
  mode: "prepaid" | "x402-onchain";
}

function assertLimitsInsideLock(
  ledger: LedgerSnapshot,
  amount: number,
  agentId: string | undefined,
  day: string,
): void {
  const workspaceUsed = ledger.workspaceDailySpend[day] ?? 0;
  if (workspaceUsed + amount > ledger.dailyCapUsdc + 1e-9) {
    throw new MeterLiveError(
      "LIMIT_WORKSPACE_DAILY",
      `Workspace daily x402-style cap exceeded (${workspaceUsed.toFixed(4)} + ${amount} > ${ledger.dailyCapUsdc} USDC). Batch or wait for next UTC day.`,
      429,
      { workspaceUsed, amount, cap: ledger.dailyCapUsdc },
    );
  }
  const callCeiling = ledger.limits.find((l) => l.id === "lm_call")?.cap ?? 0.25;
  if (amount > callCeiling + 1e-9) {
    throw new MeterLiveError(
      "LIMIT_CALL_CEILING",
      `Call amount ${amount} exceeds ceiling ${callCeiling}`,
      400,
    );
  }
  if (!agentId) return;
  const agentUsed = ledger.dailySpend[agentId]?.[day] ?? 0;
  const agent = ledger.agents.find((a) => a.id === agentId);
  if (agent?.status === "suspended") {
    throw new MeterLiveError("AGENT_SUSPENDED", `Agent ${agentId} is suspended`, 403);
  }
  if (agent?.status === "throttled" && agentUsed + amount > ledger.dailyCapUsdc * 0.5) {
    throw new MeterLiveError(
      "AGENT_THROTTLED",
      `Agent ${agentId} is throttled and near spend ceiling`,
      429,
    );
  }
}

export async function assertWithinLimits(amount: number, agentId?: string): Promise<void> {
  const ledger = await getLedger();
  assertLimitsInsideLock(ledger, amount, agentId, utcDayKey());
}

export async function authorizePrepaid(input: {
  agentId: string;
  agentToken: string;
  amount: number;
  endpoint: string;
}): Promise<PayAuthorization> {
  const day = utcDayKey();
  let txHash = "";

  await mutateLedger((ledger) => {
    assertLimitsInsideLock(ledger, input.amount, input.agentId, day);
    const agent = ledger.agents.find((a) => a.id === input.agentId);
    if (!agent) {
      throw new MeterLiveError(
        "AGENT_NOT_FOUND",
        `Unknown agent ${input.agentId}. Fund a subaccount first.`,
        404,
      );
    }
    if (!agent.tokenHash) {
      throw new MeterLiveError(
        "AGENT_TOKEN_REQUIRED",
        `Agent ${input.agentId} has no token. Re-fund the subaccount to mint X-Meter-Agent-Token.`,
        401,
      );
    }
    const provided = hashAgentToken(input.agentToken);
    if (!tokensEqual(provided, agent.tokenHash)) {
      throw new MeterLiveError(
        "AGENT_UNAUTHORIZED",
        "Invalid X-Meter-Agent-Token for this agent",
        401,
      );
    }
    if (agent.balance + 1e-9 < input.amount) {
      throw new MeterLiveError(
        "INSUFFICIENT_BALANCE",
        `Agent balance ${agent.balance} USDC < ${input.amount} USDC`,
        402,
      );
    }
    agent.balance = Number((agent.balance - input.amount).toFixed(6));
    agent.spent24h = Number((agent.spent24h + input.amount).toFixed(6));
    ledger.dailySpend[agent.id] ??= {};
    ledger.dailySpend[agent.id]![day] = Number(
      ((ledger.dailySpend[agent.id]![day] ?? 0) + input.amount).toFixed(6),
    );
    ledger.workspaceDailySpend[day] = Number(
      ((ledger.workspaceDailySpend[day] ?? 0) + input.amount).toFixed(6),
    );
    txHash = `prepaid:${randomUUID().replace(/-/g, "").slice(0, 24)}`;
  });

  return {
    agentId: input.agentId,
    amount: input.amount,
    settle: "settled",
    txHash,
    mode: "prepaid",
  };
}

/** Reverse a prepaid debit when downstream work fails (no receipt written). */
export async function refundPrepaid(auth: PayAuthorization): Promise<void> {
  if (auth.mode !== "prepaid") return;
  const day = utcDayKey();
  await mutateLedger((ledger) => {
    const agent = ledger.agents.find((a) => a.id === auth.agentId);
    if (!agent) return;
    agent.balance = Number((agent.balance + auth.amount).toFixed(6));
    agent.spent24h = Number(Math.max(0, agent.spent24h - auth.amount).toFixed(6));
    const agentDay = ledger.dailySpend[agent.id]?.[day];
    if (agentDay != null) {
      ledger.dailySpend[agent.id]![day] = Number(Math.max(0, agentDay - auth.amount).toFixed(6));
    }
    const ws = ledger.workspaceDailySpend[day];
    if (ws != null) {
      ledger.workspaceDailySpend[day] = Number(Math.max(0, ws - auth.amount).toFixed(6));
    }
  });
}

export async function authorizeFromRequest(input: {
  request: Request;
  amount: number;
  endpoint: string;
  resourceUrl: string;
}): Promise<PayAuthorization | null> {
  const agentId = input.request.headers.get("x-meter-agent-id");
  const prepaid = input.request.headers.get("x-meter-payment");
  const agentToken =
    input.request.headers.get("x-meter-agent-token") ??
    input.request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";
  const paymentSig =
    input.request.headers.get("payment-signature") ??
    input.request.headers.get("PAYMENT-SIGNATURE");

  if (prepaid === "prepaid") {
    if (!agentId) {
      throw new MeterLiveError(
        "PREPAID_NEEDS_AGENT",
        "X-Meter-Payment: prepaid requires X-Meter-Agent-Id",
        400,
      );
    }
    if (!agentToken) {
      throw new MeterLiveError(
        "PREPAID_NEEDS_TOKEN",
        "X-Meter-Payment: prepaid requires X-Meter-Agent-Token (minted on fund)",
        401,
      );
    }
    return authorizePrepaid({
      agentId,
      agentToken,
      amount: input.amount,
      endpoint: input.endpoint,
    });
  }

  if (paymentSig) {
    const payload = decodePaymentSignature(paymentSig);
    const paidUsdc = extractPaymentAmountUsdc(payload);
    if (paidUsdc != null && paidUsdc + 1e-9 < input.amount) {
      throw new MeterLiveError(
        "X402_AMOUNT_MISMATCH",
        `Payment amount ${paidUsdc} USDC below required ${input.amount} USDC`,
        402,
        { paidUsdc, required: input.amount },
      );
    }
    const resource = extractPaymentResource(payload);
    if (resource && resource !== input.resourceUrl) {
      throw new MeterLiveError(
        "X402_RESOURCE_MISMATCH",
        "PAYMENT-SIGNATURE resource does not match this endpoint",
        402,
        { expected: input.resourceUrl, got: resource },
      );
    }
    const settled = await facilitatorSettle(payload, {
      expectedAmountUsdc: input.amount,
      expectedResource: input.resourceUrl,
    });
    const day = utcDayKey();
    const id = agentId ?? `onchain:${settled.payer ?? "unknown"}`;
    await mutateLedger((ledger) => {
      assertLimitsInsideLock(ledger, input.amount, id, day);
      ledger.workspaceDailySpend[day] = Number(
        ((ledger.workspaceDailySpend[day] ?? 0) + input.amount).toFixed(6),
      );
      ledger.dailySpend[id] ??= {};
      ledger.dailySpend[id]![day] = Number(
        ((ledger.dailySpend[id]![day] ?? 0) + input.amount).toFixed(6),
      );
    });
    return {
      agentId: id,
      amount: input.amount,
      settle: "settled",
      txHash: settled.transaction,
      mode: "x402-onchain",
    };
  }

  return null;
}

export async function recordPaidCall(input: {
  auth: PayAuthorization;
  endpoint: string;
  query?: string;
  provider?: string;
}): Promise<Receipt> {
  const receipt: Receipt = {
    id: `rc_${randomUUID().replace(/-/g, "").slice(0, 10)}`,
    txHash: input.auth.txHash,
    endpoint: input.endpoint,
    agentId: input.auth.agentId,
    amount: input.auth.amount,
    time: new Date().toISOString(),
    settle: input.auth.settle,
  };
  if (input.query) receipt.query = input.query;
  if (input.provider) receipt.provider = input.provider;
  await appendReceipt(receipt);
  return receipt;
}
