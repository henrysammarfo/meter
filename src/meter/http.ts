/**
 * HTTP router for /api/v1/* — production Agent OS surface.
 * Live providers only. No mocks, no silent fallbacks.
 */

import { MeterConfigError, MeterLiveError, getEnv } from "./env";
import { buildFloviaOverview } from "./flovia";
import { fundAgent, getLedger, getReceipt, refreshLimitUsage } from "./ledger";
import { issueInvoiceForAgent, markInvoicePaid } from "./invoice";
import { handleResearch } from "./research";
import { meterChat } from "./llm";
import { tinyfishWallet } from "./clients/tinyfish";
import { probeLiveProviders } from "./health";
import { mcpSkillCatalog, openApiDocument } from "./catalog";
import {
  corsHeaders,
  idempotencyKey,
  readIdempotent,
  requireOperator,
  storeIdempotent,
} from "./security";
import { joinWaitlist, waitlistCount } from "./waitlist";

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

function withCors(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  corsHeaders(request).forEach((v, k) => headers.set(k, v));
  return new Response(response.body, { status: response.status, headers });
}

export async function handleMeterApi(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/v1/")) return null;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  try {
    const idem = request.method === "POST" ? idempotencyKey(request) : null;
    if (idem) {
      const replay = readIdempotent(idem);
      if (replay) return withCors(request, replay);
    }

    let response: Response;

    if (url.pathname === "/api/v1/health" && request.method === "GET") {
      const deep =
        url.searchParams.get("deep") === "1" ||
        url.searchParams.get("deep") === "true";
      const probes = await probeLiveProviders(deep);
      const env = getEnv();
      const ok =
        probes.tavily.configured &&
        probes.tinyfish.configured &&
        (!deep ||
          (Boolean(probes.tavily.reachable) && Boolean(probes.tinyfish.reachable)));
      response = Response.json({
        ok,
        service: "METER",
        track: "A",
        doctrine: "no_mocks_no_fallbacks",
        dailyCapUsdc: env.METER_DAILY_CAP_USDC,
        researchPriceUsdc: env.METER_RESEARCH_PRICE_USDC,
        takeRate: env.METER_TAKE_RATE,
        live: {
          tavily: probes.tavily,
          tinyfish: probes.tinyfish,
          llm: probes.llm,
          onchainX402: probes.onchainX402,
          binanceAgentOs: probes.binanceAgentOs,
          operatorAuth: probes.operatorAuth,
        },
        waitlistCount: await waitlistCount(),
      });
    } else if (
      url.pathname === "/api/v1/research" &&
      (request.method === "GET" || request.method === "POST")
    ) {
      response = await handleResearch(request);
    } else if (url.pathname === "/api/v1/subaccounts" && request.method === "POST") {
      requireOperator(request);
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
      if (!(amount > 0)) {
        throw new MeterLiveError("INVALID_AMOUNT", "amount must be > 0", 400);
      }
      const agent = await fundAgent({
        id,
        label: body.label ?? id,
        owner: body.owner ?? "operator",
        amount,
      });
      response = Response.json(
        {
          balance: agent.balance,
          funded: agent.funded,
          cap_24h: getEnv().METER_DAILY_CAP_USDC,
          withdrawalsRestricted: true,
          agent,
        },
        { status: 201 },
      );
    } else if (url.pathname === "/api/v1/invoices" && request.method === "POST") {
      requireOperator(request);
      const body = await readJson<{ agentId?: string }>(request);
      if (!body.agentId) {
        throw new MeterLiveError("MISSING_AGENT", "agentId required", 400);
      }
      response = Response.json(await issueInvoiceForAgent(body.agentId), {
        status: 201,
      });
    } else if (url.pathname.startsWith("/api/v1/invoices/") && request.method === "POST") {
      requireOperator(request);
      const id = url.pathname
        .replace("/api/v1/invoices/", "")
        .replace(/\/pay$/, "");
      if (!url.pathname.endsWith("/pay")) {
        response = Response.json(
          { error: "NOT_FOUND", message: `No route ${url.pathname}` },
          { status: 404 },
        );
      } else {
        response = Response.json(await markInvoicePaid(id));
      }
    } else if (url.pathname === "/api/v1/ledger" && request.method === "GET") {
      response = Response.json(await buildFloviaOverview());
    } else if (url.pathname === "/api/v1/limits" && request.method === "GET") {
      response = Response.json({ limits: await refreshLimitUsage() });
    } else if (url.pathname === "/api/v1/agents" && request.method === "GET") {
      const ledger = await getLedger();
      response = Response.json({ agents: ledger.agents });
    } else if (url.pathname === "/api/v1/waitlist" && request.method === "POST") {
      const body = await readJson<{ email?: string; source?: string }>(request);
      if (!body.email) {
        throw new MeterLiveError("MISSING_EMAIL", "email required", 400);
      }
      const ua = request.headers.get("user-agent");
      const result = await joinWaitlist({
        email: body.email,
        source: body.source ?? "landing",
        ...(ua ? { userAgent: ua } : {}),
      });
      response = Response.json(
        { ...result, total: await waitlistCount() },
        { status: result.duplicate ? 200 : 201 },
      );
    } else if (url.pathname === "/api/v1/openapi.json" && request.method === "GET") {
      response = Response.json(openApiDocument(url.origin));
    } else if (url.pathname === "/api/v1/mcp/skills" && request.method === "GET") {
      response = Response.json(mcpSkillCatalog(url.origin));
    } else if (url.pathname === "/api/v1/receipts" && request.method === "GET") {
      const ledger = await getLedger();
      response = Response.json({ receipts: ledger.receipts.slice(0, 100) });
    } else if (url.pathname.startsWith("/api/v1/receipts/") && request.method === "GET") {
      const id = url.pathname.replace("/api/v1/receipts/", "");
      const receipt = await getReceipt(id);
      if (!receipt) {
        throw new MeterLiveError("RECEIPT_NOT_FOUND", `Unknown receipt ${id}`, 404);
      }
      response = Response.json(receipt);
    } else if (url.pathname === "/api/v1/llm/ping" && request.method === "POST") {
      requireOperator(request);
      const { content, provider } = await meterChat(
        [{ role: "user", content: "Reply with exactly: METER_OK" }],
        { maxTokens: 16 },
      );
      response = Response.json({
        ok: content.includes("METER_OK"),
        content,
        provider,
      });
    } else if (
      url.pathname === "/api/v1/providers/tinyfish/wallet" &&
      request.method === "GET"
    ) {
      requireOperator(request);
      response = Response.json({ wallet: await tinyfishWallet() });
    } else {
      response = Response.json(
        { error: "NOT_FOUND", message: `No route ${url.pathname}` },
        { status: 404 },
      );
    }

    if (idem && request.method === "POST" && response.status < 500) {
      response = await storeIdempotent(idem, response);
    }
    return withCors(request, response);
  } catch (err) {
    return withCors(request, jsonError(err));
  }
}
