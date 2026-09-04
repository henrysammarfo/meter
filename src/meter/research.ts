/**
 * Paid /research skill — live Tavily + TinyFish only. No hallucinated answers.
 */

import { getEnv, MeterLiveError } from "./env";
import { tavilySearch } from "./clients/tavily";
import { tinyfishSearch } from "./clients/tinyfish";
import { authorizeFromRequest, recordPaidCall } from "./paystream";
import type { ResearchResult } from "./types";
import {
  buildPaymentRequired,
  paymentRequiredResponse,
} from "./x402";

export async function handleResearch(request: Request): Promise<Response> {
  const env = getEnv();
  const url = new URL(request.url);
  const query =
    url.searchParams.get("q") ??
    url.searchParams.get("query") ??
    (request.method !== "GET"
      ? String(((await request.clone().json().catch(() => null)) as { q?: string } | null)?.q ?? "")
      : "");

  if (!query.trim()) {
    return Response.json(
      { error: "missing_query", message: "Provide q= search query" },
      { status: 400 },
    );
  }

  const price = env.METER_RESEARCH_PRICE_USDC;
  const resourceUrl = `${url.origin}/api/v1/research`;
  const auth = await authorizeFromRequest({
    request,
    amount: price,
    endpoint: "/research",
    resourceUrl,
  });

  if (!auth) {
    return paymentRequiredResponse(
      buildPaymentRequired({
        resourceUrl,
        priceUsdc: price,
        description: `METER paid research query: ${query.slice(0, 120)}`,
      }),
      {
        "X-Meter-Endpoint": "/research",
        "X-Meter-Unit": "query",
        "X-Meter-Price": String(price),
        "X-Meter-Settle": "x402",
      },
    );
  }

  // Live providers — if either hard-fails auth, surface it. Soft-enrichment: TinyFish optional? 
  // Doctrine: no fallbacks. Both must succeed for full research package.
  const tavily = await tavilySearch(query, { maxResults: 6 });
  const tiny = await tinyfishSearch(
    query,
    "Enrich METER agent research with ranked web sources for fact-checking",
  );

  if (!tavily.results.length && !tiny.results.length) {
    throw new MeterLiveError(
      "RESEARCH_EMPTY",
      "Live providers returned zero sources for this query",
      502,
    );
  }

  const sources = [
    ...tavily.results.map((r) => {
      const item: { title: string; url: string; snippet?: string } = {
        title: r.title,
        url: r.url,
      };
      if (r.content) item.snippet = r.content;
      return item;
    }),
    ...tiny.results.map((r) => {
      const item: { title: string; url: string; snippet?: string } = {
        title: r.title,
        url: r.url,
      };
      if (r.snippet) item.snippet = r.snippet;
      return item;
    }),
  ];

  // Deduplicate by URL
  const seen = new Set<string>();
  const deduped = sources.filter((s) => {
    if (seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });

  const answer =
    tavily.answer?.trim() ||
    `Live aggregate of ${deduped.length} sources from Tavily + TinyFish. No model synthesis (AgentRouter unreachable or unused for this path).`;

  const receipt = await recordPaidCall({
    auth,
    endpoint: "/research",
    query,
    provider: "tavily+tinyfish",
  });

  const body: ResearchResult = {
    query,
    answer,
    sources: deduped.slice(0, 12),
    providers: ["tavily", "tinyfish-search"],
    receiptId: receipt.id,
    amount: price,
  };

  return Response.json(body, {
    status: 200,
    headers: {
      "X-Meter-Receipt": receipt.id,
      "X-Meter-Amount": String(price),
      "PAYMENT-RESPONSE": Buffer.from(
        JSON.stringify({
          success: true,
          transaction: auth.txHash,
          mode: auth.mode,
        }),
        "utf8",
      ).toString("base64"),
    },
  });
}
