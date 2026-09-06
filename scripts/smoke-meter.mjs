#!/usr/bin/env node
/**
 * Live smoke + stress for METER /api/v1.
 * Run against a running server: BASE_URL=http://127.0.0.1:3000 node --env-file=.env scripts/smoke-meter.mjs
 * Or import meter modules directly for offline ledger path.
 */

import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";

const BASE = process.env.BASE_URL;

async function runDirect() {
  // Dynamic import compiled TS via vite-node isn't available; use tsx/node with register.
  // Prefer hitting HTTP once server is up. For CI without SSR, exercise ledger via subprocess build.
  console.log("Direct module smoke requires running server — starting vite briefly…");
}

async function waitForHealth(base, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`${base}/api/v1/health`);
      if (res.ok) return true;
    } catch {
      /* retry */
    }
    await sleep(1000);
  }
  return false;
}

async function main() {
  let base = BASE;
  let child = null;

  if (!base) {
    child = spawn("npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", "4179"], {
      cwd: process.cwd(),
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    });
    base = "http://127.0.0.1:4179";
    child.stdout.on("data", (d) => process.stdout.write(`[dev] ${d}`));
    child.stderr.on("data", (d) => process.stderr.write(`[dev] ${d}`));
    const ok = await waitForHealth(base, 90);
    if (!ok) {
      child.kill("SIGTERM");
      throw new Error("Dev server never became healthy");
    }
  }

  const agent = `agent_smoke_${Date.now().toString(36)}`;
  const operatorKey = process.env.METER_OPERATOR_KEY;
  const operatorHeaders = operatorKey
    ? { "X-Meter-Operator-Key": operatorKey }
    : {};
  const steps = [];

  async function step(name, fn) {
    const t0 = Date.now();
    try {
      await fn();
      steps.push({ name, ok: true, ms: Date.now() - t0 });
      console.log(`✓ ${name} (${Date.now() - t0}ms)`);
    } catch (e) {
      steps.push({ name, ok: false, ms: Date.now() - t0, error: String(e) });
      console.error(`✗ ${name}:`, e);
      throw e;
    }
  }

  try {
    await step("health", async () => {
      const res = await fetch(`${base}/api/v1/health?deep=1`);
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(JSON.stringify(body));
      if (!body.live?.tavily?.configured || !body.live?.tinyfish?.configured) {
        throw new Error("Tavily/TinyFish keys not visible to server");
      }
      if (!body.live.tavily.reachable || !body.live.tinyfish.reachable) {
        throw new Error(`Deep health probes failed: ${JSON.stringify(body.live)}`);
      }
      if (!body.live?.settleRails?.length) {
        throw new Error("health missing settleRails");
      }
      const prepaid = body.live.settleRails.find((r) => r.id === "prepaid");
      if (!prepaid?.live) throw new Error("prepaid settle rail not live");
    });

    await step("waitlist", async () => {
      const res = await fetch(`${base}/api/v1/waitlist`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: `smoke+${Date.now()}@meter.dev`, source: "smoke" }),
      });
      const body = await res.json();
      if (res.status !== 201 && res.status !== 200) throw new Error(JSON.stringify(body));
    });

    await step("openapi+mcp", async () => {
      const oa = await fetch(`${base}/api/v1/openapi.json`);
      const mcp = await fetch(`${base}/api/v1/mcp/skills`);
      if (!oa.ok || !mcp.ok) throw new Error("catalog endpoints failed");
      const skills = await mcp.json();
      if (!skills.skills?.length) throw new Error("empty MCP skill catalog");
    });

    await step("fund", async () => {
      if (!operatorKey) throw new Error("METER_OPERATOR_KEY missing for fund mutation");
      const res = await fetch(`${base}/api/v1/subaccounts`, {
        method: "POST",
        headers: { "content-type": "application/json", ...operatorHeaders },
        body: JSON.stringify({ id: agent, label: "Smoke", owner: "CI", amount: 1 }),
      });
      const body = await res.json();
      if (res.status !== 201) throw new Error(JSON.stringify(body));
    });

    await step("402 challenge", async () => {
      const res = await fetch(`${base}/api/v1/research?q=${encodeURIComponent("x402 protocol")}`);
      if (res.status !== 402) throw new Error(`expected 402 got ${res.status}`);
      if (!res.headers.get("payment-required")) throw new Error("missing PAYMENT-REQUIRED");
    });

    await step("paid research live", async () => {
      const res = await fetch(`${base}/api/v1/research?q=${encodeURIComponent("Binance Agent OS x402")}`, {
        headers: {
          "X-Meter-Agent-Id": agent,
          "X-Meter-Payment": "prepaid",
        },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(body));
      if (!body.sources?.length) throw new Error("no live sources");
      if (!body.pages?.length) throw new Error("no live TinyFish fetched pages");
      if (!body.receiptId) throw new Error("no receipt");
      if (!body.providers?.includes("tinyfish-fetch")) throw new Error("missing tinyfish-fetch provider");
    });

    await step("invoice", async () => {
      if (!operatorKey) throw new Error("METER_OPERATOR_KEY missing for invoice mutation");
      const res = await fetch(`${base}/api/v1/invoices`, {
        method: "POST",
        headers: { "content-type": "application/json", ...operatorHeaders },
        body: JSON.stringify({ agentId: agent }),
      });
      const body = await res.json();
      if (res.status !== 201) throw new Error(JSON.stringify(body));
    });

    await step("ledger", async () => {
      const res = await fetch(`${base}/api/v1/ledger`);
      const body = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(body));
      if (body.calls24h < 1) throw new Error("ledger missing calls");
    });

    // stress: 5 parallel paid calls (still under $20 cap)
    await step("stress x5 parallel", async () => {
      // refill
      await fetch(`${base}/api/v1/subaccounts`, {
        method: "POST",
        headers: { "content-type": "application/json", ...operatorHeaders },
        body: JSON.stringify({ id: agent, amount: 2 }),
      });
      const results = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          fetch(`${base}/api/v1/research?q=${encodeURIComponent(`meter stress ${i}`)}`, {
            headers: {
              "X-Meter-Agent-Id": agent,
              "X-Meter-Payment": "prepaid",
            },
          }).then(async (r) => ({ status: r.status, body: await r.json() })),
        ),
      );
      const fails = results.filter((r) => r.status !== 200);
      if (fails.length) throw new Error(JSON.stringify(fails));
    });

    console.log("\nSMOKE OK", steps);
    process.exitCode = 0;
  } finally {
    if (child && child.pid) {
      try { process.kill(-child.pid, "SIGTERM"); } catch {}
      setTimeout(() => {
        try { process.kill(-child.pid, "SIGKILL"); } catch {}
      }, 1500).unref?.();
    }
  }
}

main()
  .then(() => {
    setTimeout(() => process.exit(process.exitCode ?? 0), 2000);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
