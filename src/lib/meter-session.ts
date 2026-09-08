/**
 * Browser session helpers — wallet and/or vault credentials.
 * Not a server cookie; restores from localStorage across reloads.
 */

import { DEMO_AGENT } from "./meter-data";
import { getStoredWalletAddress, refreshBrowserWallet } from "./meter-wallet";
import { getAgentToken, getOperatorKey } from "./meter-workspace";

const SESSION_KEY = "meter.session.v1";

export type MeterSession = {
  lastSeenAt: string;
  wallet: string;
  hasOperatorKey: boolean;
  hasDemoAgentToken: boolean;
  mode: "wallet" | "operator" | "demo" | "mixed" | "anonymous";
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function isMeterSignedIn(): boolean {
  return Boolean(
    getStoredWalletAddress() || getOperatorKey() || getAgentToken(DEMO_AGENT),
  );
}

export function canMutateLedger(): boolean {
  return Boolean(getOperatorKey());
}

export function canRunPrepaidDemo(): boolean {
  return Boolean(getAgentToken(DEMO_AGENT));
}

export function sessionMode(): MeterSession["mode"] {
  const wallet = Boolean(getStoredWalletAddress());
  const op = Boolean(getOperatorKey());
  const demo = Boolean(getAgentToken(DEMO_AGENT));
  const n = Number(wallet) + Number(op) + Number(demo);
  if (n === 0) return "anonymous";
  if (n > 1) return "mixed";
  if (wallet) return "wallet";
  if (op) return "operator";
  return "demo";
}

export function readSessionSnapshot(): MeterSession {
  return {
    lastSeenAt: new Date().toISOString(),
    wallet: getStoredWalletAddress(),
    hasOperatorKey: Boolean(getOperatorKey()),
    hasDemoAgentToken: Boolean(getAgentToken(DEMO_AGENT)),
    mode: sessionMode(),
  };
}

export function touchSession() {
  if (!canUseStorage()) return;
  const snap = readSessionSnapshot();
  localStorage.setItem(SESSION_KEY, JSON.stringify(snap));
}

export async function restoreSession(): Promise<MeterSession> {
  await refreshBrowserWallet();
  const snap = readSessionSnapshot();
  touchSession();
  return snap;
}

export function operatorKeyHint(): string {
  return "Operator key authorizes fund / issue / mark-paid on the shared ledger (server METER_OPERATOR_KEY). Wallet is your visible identity — it does not replace that key. Demo invoice pay works without it via /api/v1/demo/*.";
}
