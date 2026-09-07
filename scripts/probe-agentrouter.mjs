/**
 * AFTERCUT AgentRouter probe — Claude Code wire headers on agentrouter.org.
 * Prints only {ok, model, status, waf?} — never the key.
 */
import { readFileSync, existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim();
    if (key && value) process.env[key] = value;
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env"));
loadEnvFile(path.resolve(process.cwd(), "grounds/.env"));

const { liveChat, smokeSummary, getAgentRouterBase, getAgentRouterKey } = await import(
  pathToFileURL(path.resolve(process.cwd(), "src/meter/clients/agent-router.ts")).href
);

const keyRes = getAgentRouterKey();
if (!keyRes.ok) {
  console.log(JSON.stringify({ ok: false, model: "", status: 0, base: getAgentRouterBase() }));
  process.exit(1);
}

const result = await liveChat({
  user: "Reply with exactly: PONG",
  maxTokens: 16,
});
console.log(
  JSON.stringify({
    ...smokeSummary(result),
    ok: result.ok && /PONG/i.test(result.text),
    base: getAgentRouterBase(),
    provider: result.provider,
  }),
);
process.exit(result.ok && /PONG/i.test(result.text) ? 0 : 1);
