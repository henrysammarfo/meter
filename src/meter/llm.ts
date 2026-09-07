/**
 * Explicit LLM provider selection. No silent fallback between vendors.
 * METER_LLM_PROVIDER=agentrouter | venice
 * AgentRouter path uses AFTERCUT liveChat (Claude Code wire headers).
 */

import { getEnv, MeterLiveError } from "./env";
import { agentRouterChat, type ChatMessage } from "./clients/llm";
import { getAgentRouterKey } from "./clients/agent-router";
import { veniceChat } from "./clients/venice";

export type { ChatMessage };

export async function meterChat(
  messages: ChatMessage[],
  opts?: { maxTokens?: number; temperature?: number },
): Promise<{ content: string; provider: "agentrouter" | "venice" }> {
  const env = getEnv();
  const provider = env.METER_LLM_PROVIDER;

  if (provider === "venice") {
    if (!env.VENICE_API_KEY) {
      throw new MeterLiveError(
        "VENICE_UNCONFIGURED",
        "METER_LLM_PROVIDER=venice but VENICE_API_KEY is missing",
        503,
      );
    }
    return { content: await veniceChat(messages, opts), provider: "venice" };
  }

  if (provider === "agentrouter") {
    const keyRes = getAgentRouterKey();
    if (!keyRes.ok) {
      throw new MeterLiveError(
        "AGENTROUTER_UNCONFIGURED",
        `METER_LLM_PROVIDER=agentrouter but ${keyRes.error}`,
        503,
      );
    }
    return { content: await agentRouterChat(messages, opts), provider: "agentrouter" };
  }

  throw new MeterLiveError(
    "LLM_PROVIDER_UNSET",
    "Set METER_LLM_PROVIDER to agentrouter or venice. No default LLM and no silent vendor swap.",
    503,
  );
}
