/**
 * Research quote — OKX-style preview: price, balance, cap room. No debit.
 */

import { getEnv, MeterLiveError } from "./env";
import { getLedger, utcDayKey } from "./ledger";
import { hashAgentToken, tokensEqual } from "./security";

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
  next:
    | "prepaid_ok"
    | "insufficient_balance"
    | "cap_exceeded"
    | "agent_suspended"
    | "unauthorized";
  message: string;
};

export async function quoteResearch(input: {
  agentId: string;
  agentToken: string;
  endpoint?: string;
}): Promise<ResearchQuote> {
  const env = getEnv();
  const price = env.METER_RESEARCH_PRICE_USDC;
  const endpoint = input.endpoint ?? "/research";
  const ledger = await getLedger();
  const day = utcDayKey();
  const agent = ledger.agents.find((a) => a.id === input.agentId);
  if (!agent) {
    throw new MeterLiveError(
      "AGENT_NOT_FOUND",
      `Unknown agent ${input.agentId}. Fund or run /demo/seed first.`,
      404,
    );
  }
  if (!agent.tokenHash || !tokensEqual(hashAgentToken(input.agentToken), agent.tokenHash)) {
    throw new MeterLiveError(
      "AGENT_UNAUTHORIZED",
      "Invalid X-Meter-Agent-Token for this agent",
      401,
    );
  }

  const workspaceUsed = ledger.workspaceDailySpend[day] ?? 0;
  const workspaceRemaining = Number(
    Math.max(0, ledger.dailyCapUsdc - workspaceUsed).toFixed(6),
  );
  const canAfford = agent.balance + 1e-9 >= price;
  const underCap = workspaceUsed + price <= ledger.dailyCapUsdc + 1e-9;

  let next: ResearchQuote["next"] = "prepaid_ok";
  let message = `Ready to settle ${price} USDC from balance ${agent.balance} USDC.`;
  if (agent.status === "suspended") {
    next = "agent_suspended";
    message = `Agent ${agent.id} is suspended`;
  } else if (!canAfford) {
    next = "insufficient_balance";
    message = `INSUFFICIENT_BALANCE — balance ${agent.balance} USDC < ${price} USDC`;
  } else if (!underCap) {
    next = "cap_exceeded";
    message = `LIMIT_WORKSPACE_DAILY — used ${workspaceUsed} + ${price} > cap ${ledger.dailyCapUsdc}`;
  }

  return {
    endpoint,
    priceUsdc: price,
    agentId: agent.id,
    balance: agent.balance,
    workspaceUsed,
    workspaceCap: ledger.dailyCapUsdc,
    workspaceRemaining,
    canAfford,
    underCap,
    next,
    message,
  };
}
