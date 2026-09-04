/**
 * AgentRouter OpenAI-compatible client.
 * No OpenAI key. No silent model swap. Fail closed on WAF / auth errors.
 */

import { getEnv, MeterLiveError, requireSecret } from "../env";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function agentRouterChat(
  messages: ChatMessage[],
  opts?: { maxTokens?: number; temperature?: number },
): Promise<string> {
  const env = getEnv();
  const apiKey = requireSecret("AGENTROUTER_API_KEY", "AgentRouter LLM");
  const base = env.AGENTROUTER_BASE_URL.replace(/\/$/, "");
  const url = `${base}/chat/completions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      Accept: "application/json",
      "User-Agent": "OpenAI/JS 4.73.0",
      "x-stainless-lang": "js",
      "x-stainless-package-version": "4.73.0",
      "x-stainless-os": "Linux",
      "x-stainless-arch": "x64",
      "x-stainless-runtime": "node",
      "x-stainless-runtime-version": process.versions.node,
    },
    body: JSON.stringify({
      model: env.AGENTROUTER_MODEL,
      messages,
      max_tokens: opts?.maxTokens ?? 800,
      temperature: opts?.temperature ?? 0.2,
    }),
  });

  const text = await res.text();
  if (text.includes("aliyun_waf") || text.includes("aliyunCaptcha")) {
    throw new MeterLiveError(
      "AGENTROUTER_WAF",
      "AgentRouter blocked this host with an Aliyun WAF captcha. Use a non-datacenter egress, or supply VENICE_API_KEY. No LLM fallback is enabled.",
      503,
      text.slice(0, 200),
    );
  }
  if (!res.ok) {
    throw new MeterLiveError(
      "AGENTROUTER_HTTP",
      `AgentRouter HTTP ${res.status}`,
      res.status === 401 ? 401 : 502,
      text.slice(0, 800),
    );
  }

  let data: {
    choices?: Array<{ message?: { content?: string } }>;
  };
  try {
    data = JSON.parse(text) as typeof data;
  } catch {
    throw new MeterLiveError("AGENTROUTER_PARSE", "Non-JSON from AgentRouter", 502, text.slice(0, 400));
  }
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new MeterLiveError("AGENTROUTER_EMPTY", "Empty completion", 502, data);
  }
  return content;
}
