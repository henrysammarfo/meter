/**
 * AFTERCUT-proven AgentRouter client.
 * Only gateway: https://agentrouter.org — never api.anthropic.com / api.openai.com.
 * WAF bypass: Claude Code wire-image headers on every request.
 * Some cloud egress IPs (e.g. AWS us-east) get Aliyun captcha HTML even with
 * correct headers — set AGENT_ROUTER_HTTP_PROXY to a WAF-clear egress.
 */

import { ProxyAgent, fetch as undiciFetch } from "undici"

export type AgentRouterChatInput = {
  user: string
  system?: string
  maxTokens?: number
  /** Force a provider. Default: auto Claude → GPT → DeepSeek. */
  provider?: "auto" | "claude" | "gpt" | "deepseek"
  model?: string
}

export type AgentRouterChatResult = {
  ok: boolean
  text: string
  model: string
  status: number
  provider: "claude" | "gpt" | "deepseek" | "none"
  error?: string
}

function envStr(name: string): string {
  const v = process.env[name]
  return typeof v === "string" ? v.trim() : ""
}

/** Optional HTTP(S) proxy for AgentRouter (WAF-clear egress). */
export function getAgentRouterProxy(): string | null {
  const raw =
    envStr("AGENT_ROUTER_HTTP_PROXY") ||
    envStr("AGENTROUTER_HTTP_PROXY") ||
    envStr("HTTPS_PROXY") ||
    envStr("HTTP_PROXY")
  return raw || null
}

let cachedProxyAgent: ProxyAgent | null | undefined

function proxyAgent(): ProxyAgent | undefined {
  const proxy = getAgentRouterProxy()
  if (!proxy) {
    cachedProxyAgent = null
    return undefined
  }
  if (cachedProxyAgent === undefined || cachedProxyAgent === null) {
    cachedProxyAgent = new ProxyAgent(proxy)
  }
  return cachedProxyAgent
}

/** fetch that honors AGENT_ROUTER_HTTP_PROXY when set. */
async function arFetch(url: string, init: RequestInit): Promise<Response> {
  const agent = proxyAgent()
  if (!agent) {
    return fetch(url, init)
  }
  const headers: Record<string, string> = {}
  if (init.headers) {
    const h = new Headers(init.headers as HeadersInit)
    h.forEach((v, k) => {
      headers[k] = v
    })
  }
  const res = await undiciFetch(url, {
    method: init.method ?? "GET",
    headers,
    ...(typeof init.body === "string" ? { body: init.body } : {}),
    dispatcher: agent,
  })
  // Adapt undici Response to web Response for callers using res.ok / res.text()
  return new Response(Buffer.from(await res.arrayBuffer()), {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers as unknown as HeadersInit,
  })
}

/** Base host without trailing slash. Never remap to co.* — AFTERCUT uses agentrouter.org. */
export function getAgentRouterBase(): string {
  const raw =
    envStr("AGENT_ROUTER_BASE") ||
    envStr("AGENT_ROUTER_ANTHROPIC_BASE") ||
    envStr("AGENTROUTER_BASE_URL") ||
    "https://agentrouter.org"
  return raw.replace(/\/+$/, "").replace(/\/v1$/i, "")
}

/**
 * Key env order (AFTERCUT):
 * AGENT_ROUTER_API_KEY → ANTHROPIC_AUTH_TOKEN → ANTHROPIC_API_KEY
 * (+ AGENTROUTER_API_KEY for this repo's existing env name)
 */
export function getAgentRouterKey():
  | { ok: true; key: string }
  | { ok: false; error: string } {
  const key =
    envStr("AGENT_ROUTER_API_KEY") ||
    envStr("AGENTROUTER_API_KEY") ||
    envStr("ANTHROPIC_AUTH_TOKEN") ||
    envStr("ANTHROPIC_API_KEY")

  if (!key) {
    return {
      ok: false,
      error:
        "AgentRouter key missing. Set AGENT_ROUTER_API_KEY (or ANTHROPIC_AUTH_TOKEN / ANTHROPIC_API_KEY).",
    }
  }
  if (key.length < 20 || !key.startsWith("sk-")) {
    return {
      ok: false,
      error: `AgentRouter key invalid (len=${key.length}, prefix=${key.slice(0, 3)}…). Expect sk-… ~50+ chars. Do not retry.`,
    }
  }
  return { ok: true, key }
}

/** Claude Code wire-image headers — required to pass AgentRouter WAF. */
export function claudeCodeHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    "x-api-key": apiKey,
    "User-Agent": "claude-cli/2.1.158 (external, sdk-cli)",
    "anthropic-version": "2023-06-01",
    "anthropic-beta":
      "claude-code-20250219,interleaved-thinking-2025-05-14,effort-2025-11-24,oauth-2025-04-20",
    "anthropic-dangerous-direct-browser-access": "true",
    "x-app": "cli",
    "x-stainless-lang": "js",
    "x-stainless-package-version": "0.55.1",
    "x-stainless-os": "Windows",
    "x-stainless-arch": "x64",
    "x-stainless-runtime": "node",
    "x-stainless-runtime-version": process.version,
    "Content-Type": "application/json",
  }
}

function defaultClaudeModel(): string {
  return (
    envStr("AGENT_ROUTER_CLAUDE_MODEL") ||
    envStr("AGENTROUTER_MODEL") ||
    "claude-opus-5"
  )
}

function defaultGptModel(): string {
  return envStr("AGENT_ROUTER_GPT_MODEL") || "gpt-5.6-sol"
}

function defaultDeepSeekModel(): string {
  return envStr("AGENT_ROUTER_DEEPSEEK_MODEL") || "deepseek-v4-flash"
}

function extractAnthropicText(data: unknown): string {
  if (!data || typeof data !== "object") return ""
  const content = (data as { content?: unknown }).content
  if (!Array.isArray(content)) return ""
  return content
    .map((block) => {
      if (block && typeof block === "object" && "text" in block) {
        return String((block as { text: unknown }).text ?? "")
      }
      return ""
    })
    .join("")
    .trim()
}

function extractOpenAIText(data: unknown): string {
  if (!data || typeof data !== "object") return ""
  const choices = (data as { choices?: unknown }).choices
  if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== "object") {
    return ""
  }
  const message = (choices[0] as { message?: { content?: unknown } }).message
  return typeof message?.content === "string" ? message.content.trim() : ""
}

function isWafHtml(text: string): boolean {
  return (
    /aliyun_waf|aliyunCaptcha|aliyun_waf_aa/i.test(text) ||
    (/<!doctype html>/i.test(text) && /waf/i.test(text))
  )
}

async function readBody(res: Response): Promise<{ json: unknown | null; text: string }> {
  const text = await res.text()
  if (isWafHtml(text)) {
    return { json: null, text }
  }
  try {
    return { json: JSON.parse(text) as unknown, text }
  } catch {
    return { json: null, text }
  }
}

function summarizeHttpError(status: number, bodyText: string, json: unknown | null): string {
  if (isWafHtml(bodyText)) {
    const via = getAgentRouterProxy() ? "proxy still challenged" : "set AGENT_ROUTER_HTTP_PROXY to a WAF-clear egress"
    return `HTTP ${status}: Aliyun WAF HTML on this egress (${via}). Headers alone cannot clear captcha from blocked datacenter IPs.`
  }
  if (status === 402 || /budget|余额|quota|no channel|没有可用/i.test(bodyText)) {
    return `HTTP ${status}: model pool/budget exhausted — try another model (gpt-5.6-sol / deepseek-v4-flash). Key reached origin.`
  }
  if (status === 401 || /无效的令牌|invalid.?api.?key|unauthorized client/i.test(bodyText)) {
    return `HTTP ${status}: unauthorized/invalid at this host (often client fingerprint or wrong host — not proof the AgentRouter console key is dead). Prefer agentrouter.org via WAF-clear egress.`
  }
  if (status === 403 || /waf|blocked|forbidden|unauthorized client/i.test(bodyText)) {
    return `HTTP ${status}: WAF/blocked — Claude Code wire headers missing/wrong, or egress captcha.`
  }
  if (json && typeof json === "object" && "error" in json) {
    const err = (json as { error: unknown }).error
    if (typeof err === "string") return `HTTP ${status}: ${err}`
    if (err && typeof err === "object" && "message" in err) {
      return `HTTP ${status}: ${String((err as { message: unknown }).message)}`
    }
  }
  const snippet = bodyText.replace(/\s+/g, " ").slice(0, 180)
  return `HTTP ${status}: ${snippet || "empty body"}`
}

/** Claude path: POST {base}/v1/messages?beta=true */
export async function chatAnthropic(input: {
  user: string
  system?: string
  maxTokens?: number
  model?: string
}): Promise<AgentRouterChatResult> {
  const keyRes = getAgentRouterKey()
  if (!keyRes.ok) {
    return { ok: false, text: "", model: "", status: 0, provider: "none", error: keyRes.error }
  }
  const model = input.model || defaultClaudeModel()
  const url = `${getAgentRouterBase()}/v1/messages?beta=true`
  const body: Record<string, unknown> = {
    model,
    max_tokens: input.maxTokens ?? 1024,
    messages: [{ role: "user", content: input.user }],
  }
  if (input.system) body["system"] = input.system

  let res: Response
  try {
    res = await arFetch(url, {
      method: "POST",
      headers: claudeCodeHeaders(keyRes.key),
      body: JSON.stringify(body),
    })
  } catch (e) {
    return {
      ok: false,
      text: "",
      model,
      status: 0,
      provider: "claude",
      error: e instanceof Error ? e.message : String(e),
    }
  }

  const { json, text } = await readBody(res)
  if (isWafHtml(text) || !res.ok) {
    return {
      ok: false,
      text: "",
      model,
      status: isWafHtml(text) ? 403 : res.status,
      provider: "claude",
      error: summarizeHttpError(res.status, text, json),
    }
  }
  const out = extractAnthropicText(json)
  if (!out) {
    return {
      ok: false,
      text: "",
      model,
      status: res.status,
      provider: "claude",
      error: "Anthropic messages response had no text blocks",
    }
  }
  return { ok: true, text: out, model, status: res.status, provider: "claude" }
}

/** GPT / DeepSeek path: POST {base}/v1/chat/completions — same Claude Code headers. */
export async function chatOpenAI(input: {
  user: string
  system?: string
  maxTokens?: number
  model: string
  provider: "gpt" | "deepseek"
}): Promise<AgentRouterChatResult> {
  const keyRes = getAgentRouterKey()
  if (!keyRes.ok) {
    return { ok: false, text: "", model: "", status: 0, provider: "none", error: keyRes.error }
  }
  const model = input.model
  const url = `${getAgentRouterBase()}/v1/chat/completions`
  const messages: Array<{ role: string; content: string }> = []
  if (input.system) messages.push({ role: "system", content: input.system })
  messages.push({ role: "user", content: input.user })

  let res: Response
  try {
    res = await arFetch(url, {
      method: "POST",
      headers: claudeCodeHeaders(keyRes.key),
      body: JSON.stringify({
        model,
        messages,
        max_tokens: input.maxTokens ?? 1024,
      }),
    })
  } catch (e) {
    return {
      ok: false,
      text: "",
      model,
      status: 0,
      provider: input.provider,
      error: e instanceof Error ? e.message : String(e),
    }
  }

  const { json, text } = await readBody(res)
  if (isWafHtml(text) || !res.ok) {
    return {
      ok: false,
      text: "",
      model,
      status: isWafHtml(text) ? 403 : res.status,
      provider: input.provider,
      error: summarizeHttpError(res.status, text, json),
    }
  }
  const out = extractOpenAIText(json)
  if (!out) {
    return {
      ok: false,
      text: "",
      model,
      status: res.status,
      provider: input.provider,
      error: "chat/completions response had no message content",
    }
  }
  return { ok: true, text: out, model, status: res.status, provider: input.provider }
}

/**
 * Auto: Claude → GPT → DeepSeek; first success wins; join errors if all fail.
 */
export async function liveChat(input: AgentRouterChatInput): Promise<AgentRouterChatResult> {
  const keyRes = getAgentRouterKey()
  if (!keyRes.ok) {
    return { ok: false, text: "", model: "", status: 0, provider: "none", error: keyRes.error }
  }

  const mode = input.provider ?? "auto"
  const errors: string[] = []

  const tryClaude = async () => {
    const args: {
      user: string
      system?: string
      maxTokens?: number
      model?: string
    } = {
      user: input.user,
      model: input.model || defaultClaudeModel(),
    }
    if (input.system !== undefined) args.system = input.system
    if (input.maxTokens !== undefined) args.maxTokens = input.maxTokens
    return chatAnthropic(args)
  }

  const tryGpt = async () => {
    const args: {
      user: string
      system?: string
      maxTokens?: number
      model: string
      provider: "gpt"
    } = {
      user: input.user,
      model: input.model || defaultGptModel(),
      provider: "gpt",
    }
    if (input.system !== undefined) args.system = input.system
    if (input.maxTokens !== undefined) args.maxTokens = input.maxTokens
    return chatOpenAI(args)
  }

  const tryDeepSeek = async () => {
    const args: {
      user: string
      system?: string
      maxTokens?: number
      model: string
      provider: "deepseek"
    } = {
      user: input.user,
      model: input.model || defaultDeepSeekModel(),
      provider: "deepseek",
    }
    if (input.system !== undefined) args.system = input.system
    if (input.maxTokens !== undefined) args.maxTokens = input.maxTokens
    return chatOpenAI(args)
  }

  if (mode === "claude") return tryClaude()
  if (mode === "gpt") return tryGpt()
  if (mode === "deepseek") return tryDeepSeek()

  let lastStatus = 0
  for (const attempt of [tryClaude, tryGpt, tryDeepSeek]) {
    const result = await attempt()
    if (result.ok) return result
    if (result.status) lastStatus = result.status
    errors.push(`${result.provider}:${result.status}:${result.error ?? "fail"}`)
  }

  return {
    ok: false,
    text: "",
    model: "",
    status: lastStatus,
    provider: "none",
    error: errors.join(" | "),
  }
}

/** Safe public summary — never includes the key. */
export function smokeSummary(result: AgentRouterChatResult): {
  ok: boolean
  model: string
  status: number
} {
  return { ok: result.ok, model: result.model, status: result.status }
}
