/**
 * Paid /research skill — live Tavily + TinyFish Search + TinyFish Fetch.
 * Both search providers must return hits. Top URLs are fetched live. No mocks.
 */

import { getEnv, MeterLiveError } from "./env";
import { tavilySearch } from "./clients/tavily";
import { tinyfishFetch, tinyfishSearch } from "./clients/tinyfish";
import { authorizeFromRequest, recordPaidCall, refundPrepaid } from "./paystream";
import { assertAgentRateLimit } from "./security";
import type { ResearchResult } from "./types";
import { buildPaymentRequired, paymentRequiredResponse } from "./x402";

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

  // Rate-limit before debit so abusive callers cannot burn prepaid balance.
  const agentIdHint = request.headers.get("x-meter-agent-id");
  if (agentIdHint) assertAgentRateLimit(agentIdHint);

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

  try {
    // Doctrine: no fallbacks. Both search providers must succeed with ≥1 hit.
    const [tavily, tiny] = await Promise.all([
      tavilySearch(query, { maxResults: 6 }),
      tinyfishSearch(
        query,
        "Enrich METER agent research with ranked web sources for fact-checking",
      ),
    ]);

    if (!tavily.results.length) {
      throw new MeterLiveError("TAVILY_EMPTY", "Tavily returned zero live results", 502);
    }
    if (!tiny.results.length) {
      throw new MeterLiveError("TINYFISH_EMPTY", "TinyFish Search returned zero live results", 502);
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

    const seen = new Set<string>();
    const deduped = sources.filter((s) => {
      if (!s.url || seen.has(s.url)) return false;
      seen.add(s.url);
      return true;
    });

    const fetchUrls = deduped.slice(0, 3).map((s) => s.url);
    const fetched = await tinyfishFetch(
      fetchUrls,
      `Extract factual excerpts relevant to: ${query.slice(0, 400)}`,
    );
    if (!fetched.results.length) {
      throw new MeterLiveError(
        "TINYFISH_FETCH_EMPTY",
        "TinyFish Fetch returned zero pages for top research URLs",
        502,
        { urls: fetchUrls, errors: fetched.errors },
      );
    }

    const pages = fetched.results.map((p) => ({
      url: p.url,
      title: p.title ?? null,
      excerpt: (p.text ?? "").slice(0, 2500),
    }));

    const providers: string[] = ["tavily", "tinyfish-search", "tinyfish-fetch"];
    let answer =
      tavily.answer?.trim() ||
      [
        `Live research package for “${query.trim()}”.`,
        `Sources: ${deduped.length} (Tavily + TinyFish Search).`,
        `Fetched pages: ${pages.length}.`,
        "Answer is composed only from live provider payloads — no model synthesis on this path.",
      ].join(" ");

    const synthesize =
      url.searchParams.get("synthesize") === "1" ||
      url.searchParams.get("synthesize") === "true";
    if (synthesize) {
      const { meterChat } = await import("./llm");
      const context = [
        `Query: ${query}`,
        "Sources:",
        ...deduped.slice(0, 8).map((s, i) => `${i + 1}. ${s.title} — ${s.url}\n${s.snippet ?? ""}`),
        "Fetched excerpts:",
        ...pages.map((p) => `${p.url}\n${p.excerpt.slice(0, 1200)}`),
      ].join("\n\n");
      const { content, provider } = await meterChat(
        [
          {
            role: "system",
            content:
              "You synthesize factual briefs only from the supplied live sources. Cite URLs. If sources conflict, say so. Never invent facts.",
          },
          { role: "user", content: context },
        ],
        { maxTokens: 700 },
      );
      answer = content;
      providers.push(provider);
    }

    const receipt = await recordPaidCall({
      auth,
      endpoint: "/research",
      query,
      provider: providers.join("+"),
    });

    const body: ResearchResult = {
      query,
      answer,
      sources: deduped.slice(0, 12),
      pages,
      providers,
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
  } catch (err) {
    await refundPrepaid(auth);
    throw err;
  }
}
