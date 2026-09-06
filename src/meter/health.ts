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

export type SettleRailStatus = {
  id: "prepaid" | "x402-open-facilitator" | "binance-b402";
  live: boolean;
  note: string;
};

export async function probeLiveProviders(deep = false): Promise<{
  probedAt: string;
  deep: boolean;
  tavily: ProbeStatus;
  tinyfish: ProbeStatus;
  llm: ProbeStatus & { provider: string | null };
  onchainX402: { configured: boolean };
  binanceAgentOs: { configured: boolean };
  operatorAuth: { configured: boolean; required: boolean };
  /** Honest settle rails — prepaid is primary when Binance B402 form is blocked. */
  settleRails: SettleRailStatus[];
  openFacilitator: ProbeStatus & { url: string };
}> {
  const env = getEnv();
  const llmProvider = env.METER_LLM_PROVIDER ?? null;
  const llmConfigured =
    llmProvider === "venice"
      ? Boolean(env.VENICE_API_KEY)
      : llmProvider === "agentrouter"
        ? getAgentRouterKey().ok
        : false;

  const onchainConfigured = Boolean(env.METER_PAY_TO && env.METER_USDC_ASSET);
  const settleRails: SettleRailStatus[] = [
    {
      id: "prepaid",
      live: true,
      note: "METER subaccount debit — live without Binance merchant form",
    },
    {
      id: "x402-open-facilitator",
      live: onchainConfigured && !binanceConfigured(),
      note: onchainConfigured
        ? `Uses METER_FACILITATOR_URL=${env.METER_FACILITATOR_URL} (default x402.org) + METER_PAY_TO`
        : "Set METER_PAY_TO + METER_USDC_ASSET to enable open facilitator settle",
    },
    {
      id: "binance-b402",
      live: binanceConfigured(),
      note: binanceConfigured()
        ? "Binance partner clientId/accessToken configured"
        : "Blocked without partner form / support onboarding — do not fake",
    },
  ];

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
    onchainX402: { configured: onchainConfigured },
    binanceAgentOs: { configured: binanceConfigured() },
    operatorAuth: {
      configured: Boolean(env.METER_OPERATOR_KEY),
      required: isProductionMode(),
    },
    settleRails,
    openFacilitator: {
      url: env.METER_FACILITATOR_URL,
      configured: true,
      reachable: null as boolean | null,
      latencyMs: null as number | null,
      error: null as string | null,
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

  Object.assign(
    out.openFacilitator,
    await timeProbe(async () => {
      const url = `${env.METER_FACILITATOR_URL.replace(/\/$/, "")}/supported`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) throw new Error(`Facilitator /supported HTTP ${res.status}`);
      const body = (await res.json()) as { kinds?: unknown[] };
      if (!Array.isArray(body.kinds) || body.kinds.length === 0) {
        throw new Error("Facilitator /supported missing kinds[]");
      }
    }),
  );

  return out;
}
