/**
 * AFTERCUT PONG smoke — prints only {ok, model, status}. Never the key.
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

const modPath = path.resolve(process.cwd(), "src/meter/clients/agent-router.ts");
const { liveChat, smokeSummary, getAgentRouterKey } = await import(
  pathToFileURL(modPath).href
);

const keyRes = getAgentRouterKey();
if (!keyRes.ok) {
  console.log(JSON.stringify({ ok: false, model: "", status: 0 }));
  console.error(keyRes.error);
  process.exit(1);
}

const result = await liveChat({
  user: "Reply with exactly: PONG",
  maxTokens: 16,
  provider: "auto",
});

const summary = smokeSummary(result);
const pass = result.ok && /PONG/i.test(result.text);
console.log(JSON.stringify({ ...summary, ok: pass && summary.ok }));
if (!pass) {
  if (result.error) {
    // Safe diagnostic — no key material
    console.error(result.error.slice(0, 300));
  }
  process.exit(1);
}
