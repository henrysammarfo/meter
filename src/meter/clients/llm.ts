/**
 * AgentRouter LLM adapter for meterChat.
 * AFTERCUT-proven: Claude Code wire headers + https://agentrouter.org only.
 * Never calls api.anthropic.com / api.openai.com. No native SDK without headers.
 */

import { MeterLiveError } from "../env"
import {
  getAgentRouterKey,
  liveChat,
  type AgentRouterChatResult,
} from "./agent-router"

export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

function messagesToLiveInput(messages: ChatMessage[]): {
  system?: string
  user: string
} {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n")
    .trim()
  const rest = messages.filter((m) => m.role !== "system")
  if (rest.length === 0) {
    throw new MeterLiveError(
      "AGENTROUTER_BAD_REQUEST",
      "agentRouterChat requires at least one non-system message",
      400,
    )
  }
  const first = rest[0]
  if (!first) {
    throw new MeterLiveError(
      "AGENTROUTER_BAD_REQUEST",
      "agentRouterChat requires at least one non-system message",
      400,
    )
  }
  // Flatten multi-turn into a single user turn for liveChat auto path.
  const user =
    rest.length === 1 && first.role === "user"
      ? first.content
      : rest.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n")
  return system ? { system, user } : { user }
}

function throwFromResult(result: AgentRouterChatResult): never {
  const status = result.status || 502
  if (status === 401 || /key rejected|无效的令牌|invalid.?api.?key/i.test(result.error ?? "")) {
    throw new MeterLiveError(
      "AGENTROUTER_UNAUTHORIZED",
      result.error ??
        "AgentRouter rejected the API key. Refresh AGENT_ROUTER_API_KEY in .env / host secrets. No LLM fallback.",
      401,
      { model: result.model, provider: result.provider },
    )
  }
  if (status === 403 || /waf|blocked/i.test(result.error ?? "")) {
    throw new MeterLiveError(
      "AGENTROUTER_WAF",
      result.error ??
        "AgentRouter WAF/blocked — Claude Code wire headers missing or wrong UA. No LLM fallback.",
      403,
      { model: result.model, provider: result.provider },
    )
  }
  throw new MeterLiveError(
    "AGENTROUTER_HTTP",
    result.error ?? `AgentRouter failed (status ${status})`,
    status >= 500 || status === 0 ? 502 : status,
    { model: result.model, provider: result.provider },
  )
}

/**
 * Live AgentRouter chat via AFTERCUT client (auto Claude → GPT → DeepSeek).
 */
export async function agentRouterChat(
  messages: ChatMessage[],
  opts?: { maxTokens?: number; temperature?: number },
): Promise<string> {
  void opts?.temperature // AgentRouter path does not forward temperature in AFTERCUT wire
  const keyRes = getAgentRouterKey()
  if (!keyRes.ok) {
    throw new MeterLiveError("AGENTROUTER_UNCONFIGURED", keyRes.error, 503)
  }

  const { system, user } = messagesToLiveInput(messages)
  const result = await liveChat({
    user,
    ...(system !== undefined ? { system } : {}),
    maxTokens: opts?.maxTokens ?? 800,
    provider: "auto",
  })

  if (!result.ok) throwFromResult(result)
  return result.text
}
