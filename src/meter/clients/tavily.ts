/**
 * Live Tavily client. Fail closed — never invent search results.
 */

import { MeterLiveError, requireSecret } from "../env";

export interface TavilyResult {
  title: string;
  url: string;
  content?: string;
  score?: number;
}

export interface TavilySearchResponse {
  answer?: string;
  results: TavilyResult[];
}

export async function tavilySearch(
  query: string,
  opts?: { maxResults?: number },
): Promise<TavilySearchResponse> {
  const apiKey = requireSecret("TAVILY_API_KEY", "live /research");
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      max_results: opts?.maxResults ?? 6,
      include_answer: true,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new MeterLiveError(
      "TAVILY_HTTP",
      `Tavily search failed with HTTP ${res.status}`,
      502,
      text.slice(0, 800),
    );
  }
  let data: TavilySearchResponse;
  try {
    data = JSON.parse(text) as TavilySearchResponse;
  } catch {
    throw new MeterLiveError("TAVILY_PARSE", "Tavily returned non-JSON", 502, text.slice(0, 400));
  }
  if (!Array.isArray(data.results)) {
    throw new MeterLiveError("TAVILY_SHAPE", "Tavily response missing results[]", 502, data);
  }
  return data;
}
