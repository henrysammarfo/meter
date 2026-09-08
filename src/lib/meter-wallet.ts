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
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isRabby?: boolean;
  providers?: EthereumProvider[];
};

type AnnounceDetail = { info?: { name?: string; rdns?: string }; provider: EthereumProvider };

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function notify() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("meter-workspace-change"));
  }
}

function pickProvider(eth: EthereumProvider): EthereumProvider {
  const list = Array.isArray(eth.providers) && eth.providers.length > 0 ? eth.providers : [eth];
  return (
    list.find((p) => p.isMetaMask) ??
    list.find((p) => p.isRabby) ??
    list.find((p) => p.isCoinbaseWallet) ??
    list[0]!
  );
}

function getEthereumSync(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  const eth = (window as Window & { ethereum?: EthereumProvider }).ethereum;
  if (!eth) return null;
  return pickProvider(eth);
}

/** EIP-6963 discovery + brief wait for late-injected wallets (MetaMask, Rabby, etc.). */
export async function discoverBrowserWallet(timeoutMs = 1200): Promise<EthereumProvider | null> {
  if (typeof window === "undefined") return null;

  const announced: EthereumProvider[] = [];
  const onAnnounce = (event: Event) => {
    const detail = (event as CustomEvent<AnnounceDetail>).detail;
    if (detail?.provider) announced.push(detail.provider);
  };
  window.addEventListener("eip6963:announceProvider", onAnnounce as EventListener);
  try {
    window.dispatchEvent(new Event("eip6963:requestProvider"));
  } catch {
    /* ignore */
  }

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (announced.length > 0) {
      window.removeEventListener("eip6963:announceProvider", onAnnounce as EventListener);
      return (
        announced.find((p) => p.isMetaMask) ??
        announced.find((p) => p.isRabby) ??
        announced[0]!
      );
    }
    const sync = getEthereumSync();
    if (sync) {
      window.removeEventListener("eip6963:announceProvider", onAnnounce as EventListener);
      return sync;
    }
    await new Promise((r) => setTimeout(r, 50));
  }

  window.removeEventListener("eip6963:announceProvider", onAnnounce as EventListener);
  return getEthereumSync();
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
  return getEthereumSync() != null;
}

export async function connectBrowserWallet(): Promise<string> {
  const eth = (await discoverBrowserWallet(1500)) ?? getEthereumSync();
  if (!eth) {
    throw new Error(
      "No browser wallet detected. Install MetaMask/Rabby (extension or in-app browser), or continue with the /demo session.",
    );
  }

  let accounts: string[] = [];
  try {
    accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
  } catch (err) {
    const code = typeof err === "object" && err && "code" in err ? Number((err as { code: number }).code) : 0;
    if (code === 4001) throw new Error("Wallet connection rejected in the extension popup.");
    throw new Error(err instanceof Error ? err.message : "Wallet connection failed");
  }

  const address = accounts?.[0];
  if (!address) throw new Error("Wallet returned no accounts — unlock MetaMask and try again.");
  setStoredWalletAddress(address);
  return address;
}

export async function refreshBrowserWallet(): Promise<string> {
  const stored = getStoredWalletAddress();
  const eth = getEthereumSync();
  // Never wipe stored identity when the provider isn't injected yet (mobile / late inject).
  if (!eth) return stored;

  try {
    const accounts = (await eth.request({ method: "eth_accounts" })) as string[];
    const address = accounts?.[0] ?? "";
    if (address) {
      setStoredWalletAddress(address);
      return address;
    }
    return stored;
  } catch {
    return stored;
  }
}

export function disconnectBrowserWallet() {
  setStoredWalletAddress("");
}

export function subscribeWalletAccounts(onChange: (address: string) => void): () => void {
  const eth = getEthereumSync();
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
