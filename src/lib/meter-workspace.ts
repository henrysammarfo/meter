/**
 * Browser-side multi-workspace tenant + credential vault.
 * Server ledger is shared; workspaces filter which agent ids the UI shows
 * and store operator/agent tokens for authenticated mutations.
 */

const WS_KEY = "meter.workspaces.v1";
const ACTIVE_KEY = "meter.activeWorkspace.v1";
const OPERATOR_KEY = "meter.operatorKey.v1";
const TOKENS_KEY = "meter.agentTokens.v1";
const DEMO_AGENTS_KEY = "meter.demoAgents.v1";

export type MeterWorkspace = {
  id: string;
  name: string;
  /** Agent ids belonging to this workspace (UI filter). */
  agentIds: string[];
  createdAt: string;
};

const DEMO_ID = "ws_public_demo";
const ALL_ID = "ws_all";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseStorage()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function notify() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("meter-workspace-change"));
  }
}

function customWorkspaces(): MeterWorkspace[] {
  return readJson<MeterWorkspace[]>(WS_KEY, []).filter(
    (w) => w.id !== DEMO_ID && w.id !== ALL_ID,
  );
}

function demoAgentIds(): string[] {
  return [...new Set(["agent_demo_7c1", ...readJson<string[]>(DEMO_AGENTS_KEY, [])])];
}

export function listWorkspaces(): MeterWorkspace[] {
  return [
    {
      id: DEMO_ID,
      name: "Public demo",
      agentIds: demoAgentIds(),
      createdAt: "2026-09-01T00:00:00.000Z",
    },
    ...customWorkspaces(),
    {
      id: ALL_ID,
      name: "All workspaces (shared ledger)",
      agentIds: [],
      createdAt: "2026-09-01T00:00:00.000Z",
    },
  ];
}

export function getActiveWorkspaceId(): string {
  if (!canUseStorage()) return DEMO_ID;
  return localStorage.getItem(ACTIVE_KEY) ?? DEMO_ID;
}

export function getActiveWorkspace(): MeterWorkspace {
  const id = getActiveWorkspaceId();
  const list = listWorkspaces();
  return list.find((w) => w.id === id) ?? list[0]!;
}

export function setActiveWorkspace(id: string) {
  if (!canUseStorage()) return;
  localStorage.setItem(ACTIVE_KEY, id);
  notify();
}

export function createWorkspace(name: string): MeterWorkspace {
  const ws: MeterWorkspace = {
    id: `ws_${Math.random().toString(36).slice(2, 10)}`,
    name: name.trim() || "Untitled workspace",
    agentIds: [],
    createdAt: new Date().toISOString(),
  };
  writeJson(WS_KEY, [...customWorkspaces(), ws]);
  setActiveWorkspace(ws.id);
  return ws;
}

export function addAgentToWorkspace(workspaceId: string, agentId: string) {
  if (workspaceId === ALL_ID) return;
  if (workspaceId === DEMO_ID) {
    writeJson(DEMO_AGENTS_KEY, [...new Set([...demoAgentIds(), agentId])]);
    notify();
    return;
  }
  const next = customWorkspaces().map((w) => {
    if (w.id !== workspaceId) return w;
    if (w.agentIds.includes(agentId)) return w;
    return { ...w, agentIds: [...w.agentIds, agentId] };
  });
  writeJson(WS_KEY, next);
  notify();
}

/** null = show all agents (ws_all). */
export function workspaceAgentFilter(): string[] | null {
  const ws = getActiveWorkspace();
  if (ws.id === ALL_ID) return null;
  return ws.agentIds;
}

export function getOperatorKey(): string {
  if (!canUseStorage()) return "";
  return localStorage.getItem(OPERATOR_KEY) ?? "";
}

export function setOperatorKey(key: string) {
  if (!canUseStorage()) return;
  const trimmed = key.trim();
  if (trimmed) localStorage.setItem(OPERATOR_KEY, trimmed);
  else localStorage.removeItem(OPERATOR_KEY);
  notify();
}

export function getAgentTokens(): Record<string, string> {
  return readJson<Record<string, string>>(TOKENS_KEY, {});
}

export function getAgentToken(agentId: string): string {
  return getAgentTokens()[agentId] ?? "";
}

export function setAgentToken(agentId: string, token: string) {
  const next = { ...getAgentTokens() };
  const t = token.trim();
  if (t) next[agentId] = t;
  else delete next[agentId];
  writeJson(TOKENS_KEY, next);
  notify();
}

export function clearAgentToken(agentId: string) {
  setAgentToken(agentId, "");
}
