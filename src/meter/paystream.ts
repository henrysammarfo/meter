/**
 * PAYSTREAM — authorize a metered call against limits + prepaid balance or x402 settle.
 */

import { randomUUID } from "node:crypto";
import { MeterLiveError } from "./env";
import {
  appendReceipt,
  getLedger,
  mutateLedger,
  utcDayKey,
} from "./ledger";
import type { Receipt, SettleStatus } from "./types";
import { decodePaymentSignature, facilitatorSettle } from "./x402";

export interface PayAuthorization {
  agentId: string;
  amount: number;
  settle: SettleStatus;
  txHash: string;
  mode: "prepaid" | "x402-onchain";
}

export async function assertWithinLimits(amount: number, agentId?: string): Promise<void> {
  const ledger = await getLedger();
  const day = utcDayKey();
  const workspaceUsed = ledger.workspaceDailySpend[day] ?? 0;
  if (workspaceUsed + amount > ledger.dailyCapUsdc + 1e-9) {
    throw new MeterLiveError(
      "LIMIT_WORKSPACE_DAILY",
      `Workspace daily x402-style cap exceeded (${workspaceUsed.toFixed(4)} + ${amount} > ${ledger.dailyCapUsdc} USDC). Batch or wait for next UTC day.`,
      429,
      { workspaceUsed, amount, cap: ledger.dailyCapUsdc },
    );
  }
  if (agentId) {
    const agentUsed = ledger.dailySpend[agentId]?.[day] ?? 0;
    const agent = ledger.agents.find((a) => a.id === agentId);
    if (agent?.status === "suspended") {
      throw new MeterLiveError("AGENT_SUSPENDED", `Agent ${agentId} is suspended`, 403);
    }
    // soft throttle near 90% of workspace remaining for that agent if marked throttled
    if (agent?.status === "throttled" && agentUsed + amount > ledger.dailyCapUsdc * 0.5) {
      throw new MeterLiveError(
        "AGENT_THROTTLED",
        `Agent ${agentId} is throttled and near spend ceiling`,
        429,
      );
    }
  }
  const callCeiling = ledger.limits.find((l) => l.id === "lm_call")?.cap ?? 0.25;
  if (amount > callCeiling + 1e-9) {
    throw new MeterLiveError(
      "LIMIT_CALL_CEILING",
      `Call amount ${amount} exceeds ceiling ${callCeiling}`,
      400,
    );
  }
}

export async function authorizePrepaid(input: {
  agentId: string;
  amount: number;
  endpoint: string;
}): Promise<PayAuthorization> {
  await assertWithinLimits(input.amount, input.agentId);
  const day = utcDayKey();
  let txHash = "";

  await mutateLedger((ledger) => {
    const agent = ledger.agents.find((a) => a.id === input.agentId);
    if (!agent) {
      throw new MeterLiveError(
        "AGENT_NOT_FOUND",
        `Unknown agent ${input.agentId}. Fund a subaccount first.`,
        404,
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

export async function authorizeFromRequest(input: {
  request: Request;
  amount: number;
  endpoint: string;
  resourceUrl: string;
}): Promise<PayAuthorization | null> {
  const agentId = input.request.headers.get("x-meter-agent-id");
  const prepaid = input.request.headers.get("x-meter-payment");
  const paymentSig = input.request.headers.get("payment-signature")
    ?? input.request.headers.get("PAYMENT-SIGNATURE");

  if (prepaid === "prepaid") {
    if (!agentId) {
      throw new MeterLiveError(
        "PREPAID_NEEDS_AGENT",
        "X-Meter-Payment: prepaid requires X-Meter-Agent-Id",
        400,
      );
    }
    return authorizePrepaid({
      agentId,
      amount: input.amount,
      endpoint: input.endpoint,
    });
  }

  if (paymentSig) {
    const payload = decodePaymentSignature(paymentSig);
    const settled = await facilitatorSettle(payload);
    await assertWithinLimits(input.amount, agentId ?? undefined);
    const day = utcDayKey();
    const id = agentId ?? `onchain:${settled.payer ?? "unknown"}`;
    await mutateLedger((ledger) => {
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
