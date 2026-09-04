/**
 * HTTP router for /api/v1/* — production Agent OS surface.
 */

import { MeterConfigError, MeterLiveError, getEnv } from "./env";
import { buildFloviaOverview } from "./flovia";
import { fundAgent, getLedger, refreshLimitUsage } from "./ledger";
import { issueInvoiceForAgent, markInvoicePaid } from "./invoice";
import { handleResearch } from "./research";
import { agentRouterChat } from "./clients/llm";
import { tinyfishWallet } from "./clients/tinyfish";

function jsonError(err: unknown): Response {
  if (err instanceof MeterLiveError) {
    return Response.json(
      { error: err.code, message: err.message, details: err.details ?? null },
      { status: err.status },
    );
  }
  if (err instanceof MeterConfigError) {
    return Response.json({ error: err.code, message: err.message }, { status: 503 });
  }
  console.error(err);
  return Response.json(
    {
      error: "INTERNAL",
      message: err instanceof Error ? err.message : "Unknown error",
    },
    { status: 500 },
  );
}

async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new MeterLiveError("BAD_JSON", "Request body must be JSON", 400);
  }
}

export async function handleMeterApi(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/v1/")) return null;

  try {
    if (url.pathname === "/api/v1/health" && request.method === "GET") {
      const env = getEnv();
      return Response.json({
        ok: true,
        service: "METER",
        track: "A",
        live: {
          tavily: Boolean(env.TAVILY_API_KEY),
          tinyfish: Boolean(env.TINYFISH_API_KEY),
          agentrouter: Boolean(env.AGENTROUTER_API_KEY),
          onchainX402: Boolean(env.METER_PAY_TO && env.METER_USDC_ASSET),
          binanceAgentOs: Boolean(env.BINANCE_AGENT_OS_API_KEY),
        },
        dailyCapUsdc: env.METER_DAILY_CAP_USDC,
        researchPriceUsdc: env.METER_RESEARCH_PRICE_USDC,
        doctrine: "no_mocks_no_fallbacks",
      });
    }

    if (url.pathname === "/api/v1/research" && (request.method === "GET" || request.method === "POST")) {
      return await handleResearch(request);
    }

    if (url.pathname === "/api/v1/subaccounts" && request.method === "POST") {
      const body = await readJson<{
        agent?: string;
        id?: string;
        label?: string;
        owner?: string;
        amount?: number;
      }>(request);
      const id = body.id ?? body.agent;
      if (!id) throw new MeterLiveError("MISSING_AGENT", "Provide id or agent", 400);
      const amount = body.amount ?? 5;
      const agent = await fundAgent({
        id,
        label: body.label ?? id,
        owner: body.owner ?? "demo-operator",
        amount,
      });
      return Response.json(
        {
          balance: agent.balance,
          funded: agent.funded,
          cap_24h: getEnv().METER_DAILY_CAP_USDC,
          withdrawalsRestricted: true,
          agent,
        },
        { status: 201 },
      );
    }

    if (url.pathname === "/api/v1/invoices" && request.method === "POST") {
      const body = await readJson<{ agentId?: string }>(request);
      if (!body.agentId) throw new MeterLiveError("MISSING_AGENT", "agentId required", 400);
      const invoice = await issueInvoiceForAgent(body.agentId);
      return Response.json(invoice, { status: 201 });
    }

    if (url.pathname.startsWith("/api/v1/invoices/") && request.method === "POST") {
      const id = url.pathname.replace("/api/v1/invoices/", "").replace(/\/pay$/, "");
      if (url.pathname.endsWith("/pay")) {
        const invoice = await markInvoicePaid(id);
        return Response.json(invoice);
      }
    }

    if (url.pathname === "/api/v1/ledger" && request.method === "GET") {
      const overview = await buildFloviaOverview();
      return Response.json(overview);
    }

    if (url.pathname === "/api/v1/limits" && request.method === "GET") {
      return Response.json({ limits: await refreshLimitUsage() });
    }

    if (url.pathname === "/api/v1/agents" && request.method === "GET") {
      const ledger = await getLedger();
      return Response.json({ agents: ledger.agents });
    }

    if (url.pathname === "/api/v1/llm/ping" && request.method === "POST") {
      const content = await agentRouterChat([
        { role: "user", content: "Reply with exactly: METER_OK" },
      ], { maxTokens: 16 });
      return Response.json({ ok: content.includes("METER_OK"), content });
    }

    if (url.pathname === "/api/v1/providers/tinyfish/wallet" && request.method === "GET") {
      const wallet = await tinyfishWallet();
      return Response.json({ wallet });
    }

    return Response.json({ error: "NOT_FOUND", message: `No route ${url.pathname}` }, { status: 404 });
  } catch (err) {
    return jsonError(err);
  }
}
