/**
 * Browser wallet identity for METER UI (EIP-1193 / window.ethereum).
 * Does not replace operator key + agent token for API mutations — those stay
 * in the credential vault. Wallet is the visible “who’s signed in” surface
 * for Base/x402 operator identity.
 */

const WALLET_KEY = "meter.walletAddress.v1";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function notify() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("meter-workspace-change"));
  }
}

function getEthereum(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  const eth = (window as Window & { ethereum?: EthereumProvider }).ethereum;
  return eth ?? null;
}

export function shortAddress(address: string): string {
  const a = address.trim();
  if (a.length < 10) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function getStoredWalletAddress(): string {
  if (!canUseStorage()) return "";
  return localStorage.getItem(WALLET_KEY) ?? "";
}

export function setStoredWalletAddress(address: string) {
  if (!canUseStorage()) return;
  const trimmed = address.trim();
  if (trimmed) localStorage.setItem(WALLET_KEY, trimmed);
  else localStorage.removeItem(WALLET_KEY);
  notify();
}

export function hasBrowserWallet(): boolean {
  return getEthereum() != null;
}

export async function connectBrowserWallet(): Promise<string> {
  const eth = getEthereum();
  if (!eth) {
    throw new Error(
      "No browser wallet found. Install MetaMask, Rabby, or Coinbase Wallet — or paste your operator key in Settings.",
    );
  }
  const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
  const address = accounts?.[0];
  if (!address) throw new Error("Wallet returned no accounts");
  setStoredWalletAddress(address);
  return address;
}

export async function refreshBrowserWallet(): Promise<string> {
  const eth = getEthereum();
  if (!eth) {
    setStoredWalletAddress("");
    return "";
  }
  try {
    const accounts = (await eth.request({ method: "eth_accounts" })) as string[];
    const address = accounts?.[0] ?? "";
    if (address) setStoredWalletAddress(address);
    else if (getStoredWalletAddress()) {
      // Keep stored address if provider is locked but we had a prior connect —
      // UI still shows identity until user disconnects.
    }
    return address || getStoredWalletAddress();
  } catch {
    return getStoredWalletAddress();
  }
}

export function disconnectBrowserWallet() {
  setStoredWalletAddress("");
}

export function subscribeWalletAccounts(onChange: (address: string) => void): () => void {
  const eth = getEthereum();
  if (!eth?.on) return () => {};

  const handler = (accounts: unknown) => {
    const list = Array.isArray(accounts) ? (accounts as string[]) : [];
    const next = list[0] ?? "";
    setStoredWalletAddress(next);
    onChange(next);
  };

  eth.on("accountsChanged", handler);
  return () => {
    eth.removeListener?.("accountsChanged", handler);
  };
}
