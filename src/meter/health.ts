/**
 * Live provider health probes — keys alone are not enough.
 * Deep mode hits the real network. Failures are reported, never masked.
 * Shallow mode leaves reachable=null (not probed) — never lies with false.
 */

import { getEnv, isProductionMode } from "./env";
import { tavilySearch } from "./clients/tavily";
import { tinyfishSearch } from "./clients/tinyfish";
import { meterChat } from "./llm";
import { getAgentRouterKey } from "./clients/agent-router";
import { binanceConfigured } from "./clients/binance";

export type ProbeStatus = {
  configured: boolean;
  /** null = not probed (shallow health). Never report false without a probe. */
  reachable: boolean | null;
  latencyMs: number | null;
  error: string | null;
};

async function timeProbe(fn: () => Promise<void>): Promise<Omit<ProbeStatus, "configured">> {
  const t0 = Date.now();
  try {
    await fn();
    return { reachable: true, latencyMs: Date.now() - t0, error: null };
  } catch (err) {
    return {
      reachable: false,
      latencyMs: Date.now() - t0,
      error: err instanceof Error ? err.message.slice(0, 240) : String(err).slice(0, 240),
    };
  }
}

export async function probeLiveProviders(deep = false): Promise<{
  probedAt: string;
  deep: boolean;
  tavily: ProbeStatus;
  tinyfish: ProbeStatus;
  llm: ProbeStatus & { provider: string | null };
  onchainX402: { configured: boolean };
  binanceAgentOs: { configured: boolean };
  operatorAuth: { configured: boolean; required: boolean };
}> {
  const env = getEnv();
  const llmProvider = env.METER_LLM_PROVIDER ?? null;
  const llmConfigured =
    llmProvider === "venice"
      ? Boolean(env.VENICE_API_KEY)
      : llmProvider === "agentrouter"
        ? getAgentRouterKey().ok
        : false;

  const out = {
    probedAt: new Date().toISOString(),
    deep,
    tavily: {
      configured: Boolean(env.TAVILY_API_KEY),
      reachable: null as boolean | null,
      latencyMs: null as number | null,
      error: null as string | null,
    },
    tinyfish: {
      configured: Boolean(env.TINYFISH_API_KEY),
      reachable: null as boolean | null,
      latencyMs: null as number | null,
      error: null as string | null,
    },
    llm: {
      configured: llmConfigured,
      provider: llmProvider,
      reachable: null as boolean | null,
      latencyMs: null as number | null,
      error: llmProvider
        ? null
        : ("METER_LLM_PROVIDER unset — research path does not require LLM" as string | null),
    },
    onchainX402: { configured: Boolean(env.METER_PAY_TO && env.METER_USDC_ASSET) },
    binanceAgentOs: { configured: binanceConfigured() },
    operatorAuth: {
      configured: Boolean(env.METER_OPERATOR_KEY),
      required: isProductionMode(),
    },
  };

  if (!deep) return out;

  if (out.tavily.configured) {
    Object.assign(
      out.tavily,
      await timeProbe(async () => {
        const res = await tavilySearch("METER health probe x402", { maxResults: 1 });
        if (!res.results.length) throw new Error("Tavily returned zero results");
      }),
    );
  } else {
    out.tavily.reachable = false;
    out.tavily.error = "TAVILY_API_KEY not set";
  }

  if (out.tinyfish.configured) {
    Object.assign(
      out.tinyfish,
      await timeProbe(async () => {
        const res = await tinyfishSearch("METER health probe", "health check");
        if (!res.results.length) throw new Error("TinyFish returned zero results");
      }),
    );
  } else {
    out.tinyfish.reachable = false;
    out.tinyfish.error = "TINYFISH_API_KEY not set";
  }

  if (llmConfigured && llmProvider) {
    Object.assign(
      out.llm,
      await timeProbe(async () => {
        const { content } = await meterChat(
          [{ role: "user", content: "Reply with exactly: METER_OK" }],
          { maxTokens: 8 },
        );
        if (!content.includes("METER_OK")) {
          throw new Error(`Unexpected LLM reply: ${content.slice(0, 80)}`);
        }
      }),
    );
  } else if (llmProvider) {
    out.llm.reachable = false;
    out.llm.error = `METER_LLM_PROVIDER=${llmProvider} but API key missing`;
  }

  return out;
}
