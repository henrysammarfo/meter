/**
 * Live TinyFish Search + Fetch. Agent automation requires wallet credits —
 * we do NOT silently skip to a fake browser run.
 */

import { getEnv, MeterLiveError, requireSecret } from "../env";

export interface TinyFishSearchHit {
  title: string;
  url: string;
  snippet?: string;
  site_name?: string;
  position?: number;
}

export interface TinyFishSearchResponse {
  query: string;
  results: TinyFishSearchHit[];
  total_results?: number;
}

export async function tinyfishSearch(
  query: string,
  purpose?: string,
): Promise<TinyFishSearchResponse> {
  const apiKey = requireSecret("TINYFISH_API_KEY", "TinyFish search enrichment");
  const url = new URL("https://api.search.tinyfish.ai/");
  url.searchParams.set("query", query);
  if (purpose) url.searchParams.set("purpose", purpose.slice(0, 2000));

  const res = await fetch(url, {
    headers: { "X-API-Key": apiKey },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new MeterLiveError(
      "TINYFISH_SEARCH_HTTP",
      `TinyFish Search failed HTTP ${res.status}`,
      res.status === 401 ? 401 : 502,
      text.slice(0, 800),
    );
  }
  const data = JSON.parse(text) as TinyFishSearchResponse;
  if (!Array.isArray(data.results)) {
    throw new MeterLiveError("TINYFISH_SEARCH_SHAPE", "Missing results[]", 502, data);
  }
  return data;
}

export async function tinyfishFetch(
  urls: string[],
  purpose?: string,
): Promise<{ results: Array<{ url: string; title?: string | null; text?: string | null }>; errors: unknown[] }> {
  const apiKey = requireSecret("TINYFISH_API_KEY", "TinyFish fetch");
  if (urls.length === 0 || urls.length > 10) {
    throw new MeterLiveError("TINYFISH_FETCH_INPUT", "Provide 1–10 urls", 400);
  }
  const res = await fetch("https://api.fetch.tinyfish.ai/", {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      urls,
      format: "markdown",
      purpose,
      ttl: 0,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new MeterLiveError(
      "TINYFISH_FETCH_HTTP",
      `TinyFish Fetch failed HTTP ${res.status}`,
      502,
      text.slice(0, 800),
    );
  }
  return JSON.parse(text) as {
    results: Array<{ url: string; title?: string | null; text?: string | null }>;
    errors: unknown[];
  };
}

/** Probe wallet credits for Agent automation (optional diagnostic). */
export async function tinyfishWallet(): Promise<unknown> {
  const apiKey = requireSecret("TINYFISH_API_KEY", "TinyFish wallet probe");
  const base = getEnv();
  void base;
  const res = await fetch("https://agent.tinyfish.ai/v1/wallet", {
    headers: { "X-API-Key": apiKey },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new MeterLiveError("TINYFISH_WALLET", `Wallet probe HTTP ${res.status}`, 502, text.slice(0, 400));
  }
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text.slice(0, 400) };
  }
}
