/**
 * OpenAPI 3.1 + MCP skill catalog for Binance Agent OS / MCP clients.
 */

import { getEnv } from "./env";

export function openApiDocument(origin: string) {
  const env = getEnv();
  return {
    openapi: "3.1.0",
    info: {
      title: "METER API",
      version: "1.0.0",
      description:
        "Agent↔agent metering, x402 settle, invoices and shared receipts. No mocks. Track A — Binance Agent OS.",
    },
    servers: [{ url: origin }],
    paths: {
      "/api/v1/health": {
        get: {
          summary: "Liveness + provider configuration",
          parameters: [
            {
              name: "deep",
              in: "query",
              schema: { type: "boolean" },
              description: "When true, probe Tavily/TinyFish/AgentRouter live",
            },
          ],
          responses: { "200": { description: "Health report" } },
        },
      },
      "/api/v1/research": {
        get: {
          summary: "Paid research skill (Tavily + TinyFish Search + Fetch)",
          parameters: [
            { name: "q", in: "query", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Paid research result + receipt" },
            "402": { description: "PAYMENT-REQUIRED (x402 / prepaid)" },
          },
        },
      },
      "/api/v1/subaccounts": {
        post: {
          summary: "Fund sandbox agent subaccount (withdrawals restricted)",
          responses: { "201": { description: "Funded agent" } },
        },
      },
      "/api/v1/invoices": {
        post: {
          summary: "Issue invoice from unbilled receipts",
          responses: { "201": { description: "Invoice" } },
        },
      },
      "/api/v1/ledger": {
        get: {
          summary: "Flovia overview from durable ledger",
          responses: { "200": { description: "Ledger overview" } },
        },
      },
      "/api/v1/limits": {
        get: {
          summary: "Live limit utilization (default $20/day workspace cap)",
          responses: { "200": { description: "Limits" } },
        },
      },
      "/api/v1/waitlist": {
        post: {
          summary: "Join early-access waitlist (durable)",
          responses: { "201": { description: "Joined" }, "200": { description: "Already joined" } },
        },
      },
      "/api/v1/mcp/skills": {
        get: {
          summary: "MCP skill catalog for Agent OS registration",
          responses: { "200": { description: "Skills" } },
        },
      },
    },
    "x-meter": {
      takeRate: env.METER_TAKE_RATE,
      dailyCapUsdc: env.METER_DAILY_CAP_USDC,
      researchPriceUsdc: env.METER_RESEARCH_PRICE_USDC,
      doctrine: "no_mocks_no_fallbacks",
    },
  };
}

export function mcpSkillCatalog(origin: string) {
  const env = getEnv();
  return {
    protocol: "mcp",
    server: "meter",
    version: "1.0.0",
    skills: [
      {
        name: "meter_research",
        description:
          "Paid web research. Settles via prepaid METER subaccount or x402. Returns live Tavily + TinyFish sources and a shared receipt.",
        endpoint: `${origin}/api/v1/research`,
        method: "GET",
        priceUsdc: env.METER_RESEARCH_PRICE_USDC,
        payment: {
          schemes: ["meter-prepaid", "exact"],
          headers: {
            prepaid: ["X-Meter-Agent-Id", "X-Meter-Payment: prepaid"],
            x402: ["PAYMENT-SIGNATURE"],
          },
        },
        input: { q: "string — search query" },
        output: {
          answer: "string",
          sources: "array",
          pages: "array — TinyFish fetched markdown excerpts",
          receiptId: "string",
          amount: "number",
        },
      },
      {
        name: "meter_fund",
        description: "Fund a sandbox agent subaccount (withdrawals restricted).",
        endpoint: `${origin}/api/v1/subaccounts`,
        method: "POST",
      },
      {
        name: "meter_invoice",
        description: "Issue an A2A invoice from unbilled receipts.",
        endpoint: `${origin}/api/v1/invoices`,
        method: "POST",
      },
      {
        name: "meter_ledger",
        description: "Read shared Flovia ledger (usage, pays, fails, limits).",
        endpoint: `${origin}/api/v1/ledger`,
        method: "GET",
      },
    ],
  };
}
