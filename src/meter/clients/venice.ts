/**
 * Venice AI OpenAI-compatible client.
 * Explicit provider only — never a silent fallback from AgentRouter.
 */

import { getEnv, MeterLiveError, requireSecret } from "../env";
import type { ChatMessage } from "./llm";

export async function veniceChat(
  messages: ChatMessage[],
  opts?: { maxTokens?: number; temperature?: number; model?: string },
): Promise<string> {
  const env = getEnv();
  const apiKey = requireSecret("VENICE_API_KEY", "Venice LLM");
  const base = (env.VENICE_BASE_URL ?? "https://api.venice.ai/api/v1").replace(/\/$/, "");
  const model = opts?.model ?? env.VENICE_MODEL ?? "llama-3.3-70b";

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: opts?.maxTokens ?? 800,
      temperature: opts?.temperature ?? 0.2,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new MeterLiveError(
      "VENICE_HTTP",
      `Venice HTTP ${res.status}`,
      res.status === 401 ? 401 : 502,
      text.slice(0, 800),
    );
  }

  let data: { choices?: Array<{ message?: { content?: string } }> };
  try {
    data = JSON.parse(text) as typeof data;
  } catch {
    throw new MeterLiveError("VENICE_PARSE", "Non-JSON from Venice", 502, text.slice(0, 400));
  }
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new MeterLiveError("VENICE_EMPTY", "Empty Venice completion", 502, data);
  }
  return content;
}
