import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Wallet, LogOut, KeyRound, Play } from "lucide-react";
import { useWorkspaceRevision } from "@/components/site/WaitlistForm";
import {
  addAgentToWorkspace,
  getAgentToken,
  getOperatorKey,
  setActiveWorkspace,
  setAgentToken,
} from "@/lib/meter-workspace";
import { DEMO_AGENT } from "@/lib/meter-data";
import {
  connectBrowserWallet,
  disconnectBrowserWallet,
  getStoredWalletAddress,
  refreshBrowserWallet,
  shortAddress,
  subscribeWalletAccounts,
} from "@/lib/meter-wallet";
import { touchSession } from "@/lib/meter-session";

type Props = {
  /** compact = icon-ish chip for nav; full = labeled dashboard control */
  variant?: "nav" | "dashboard" | "hero";
  className?: string;
};

export function ConnectWalletButton({ variant = "nav", className = "" }: Props) {
  const rev = useWorkspaceRevision();
  const [mounted, setMounted] = useState(false);
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState<"wallet" | "demo" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const operatorOn = Boolean(getOperatorKey());

  useEffect(() => {
    setMounted(true);
    setAddress(getStoredWalletAddress());
    void refreshBrowserWallet().then(setAddress);
    return subscribeWalletAccounts(setAddress);
  }, [rev]);

  async function onConnect() {
    setBusy("wallet");
    setError(null);
    try {
      const next = await connectBrowserWallet();
      setAddress(next);
      touchSession();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function onDemoSession() {
    setBusy("demo");
    setError(null);
    try {
      const res = await fetch("/api/v1/demo/seed", { method: "POST" });
      const body = (await res.json()) as { agentToken?: string; message?: string; error?: string };
      if (!res.ok || !body.agentToken) {
        throw new Error(body.message ?? body.error ?? `Demo seed failed (${res.status})`);
      }
      setAgentToken(DEMO_AGENT, body.agentToken);
      addAgentToWorkspace("ws_public_demo", DEMO_AGENT);
      setActiveWorkspace("ws_public_demo");
      touchSession();
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  function onDisconnect() {
    disconnectBrowserWallet();
    setAddress("");
    setError(null);
    touchSession();
  }

  if (!mounted) {
    return (
      <div className={`flex flex-col items-end gap-1 ${className}`}>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm text-muted-foreground opacity-60"
        >
          <Wallet className="size-4" />
          Connect wallet
        </button>
      </div>
    );
  }

  if (address) {
    return (
      <div className={`flex flex-col items-end gap-1 ${className}`}>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-2 font-mono text-xs text-primary ${
              variant === "hero" ? "px-4 py-2.5 text-sm" : ""
            }`}
            title={address}
          >
            <Wallet className="size-3.5" />
            {shortAddress(address)}
          </span>
          <button
            type="button"
            onClick={onDisconnect}
            className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground"
            aria-label="Disconnect wallet"
          >
            <LogOut className="size-3.5" />
            {variant === "dashboard" ? "Disconnect" : null}
          </button>
        </div>
        {variant === "dashboard" && !operatorOn && (
          <Link
            to="/dashboard/settings"
            className="inline-flex items-center gap-1 text-[0.65rem] text-muted-foreground hover:text-primary"
          >
            <KeyRound className="size-3" /> Add operator key for fund/invoice
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-end gap-1 ${className}`}>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void onConnect()}
          className={
            variant === "hero"
              ? "inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              : variant === "dashboard"
                ? "inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                : "inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground/85 transition-colors hover:border-primary hover:text-foreground disabled:opacity-50"
          }
        >
          <Wallet className="size-4" />
          {busy === "wallet" ? "Connecting…" : "Connect wallet"}
        </button>
        {variant === "dashboard" && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void onDemoSession()}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <Play className="size-3.5" />
            {busy === "demo" ? "Seeding…" : "Demo session"}
          </button>
        )}
      </div>
      {error && (
        <div className="max-w-[18rem] text-right text-[0.65rem] text-destructive">
          <p>{error}</p>
          <p className="mt-1 text-muted-foreground">
            <a
              className="underline hover:text-foreground"
              href="https://metamask.io/download/"
              target="_blank"
              rel="noreferrer"
            >
              Get MetaMask
            </a>
            {" · "}
            <Link to="/demo" className="underline hover:text-foreground">
              Run /demo instead
            </Link>
          </p>
        </div>
      )}
      {variant === "dashboard" && (
        <Link
          to="/dashboard/settings"
          className="text-[0.65rem] text-muted-foreground hover:text-primary"
        >
          Or sign in with operator key →
        </Link>
      )}
    </div>
  );
}

export function AuthStatusChip() {
  const rev = useWorkspaceRevision();
  const [address, setAddress] = useState("");
  const [mounted, setMounted] = useState(false);
  const operatorOn = Boolean(getOperatorKey());
  const demoOn = Boolean(getAgentToken(DEMO_AGENT));

  useEffect(() => {
    setMounted(true);
    setAddress(getStoredWalletAddress());
    void refreshBrowserWallet().then(setAddress);
  }, [rev]);

  if (!mounted) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
        <span className="size-1.5 rounded-full bg-muted-foreground" />
        …
      </span>
    );
  }

  if (!address && !operatorOn && !demoOn) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[0.65rem] text-warning">
        <span className="size-1.5 rounded-full bg-warning" />
        Not signed in
      </span>
    );
  }

  const label = address
    ? shortAddress(address)
    : operatorOn
      ? "Operator key"
      : "Demo session";

  return (
    <span className="inline-flex items-center gap-1.5 text-[0.65rem] text-primary">
      <span className="size-1.5 rounded-full bg-primary" />
      {label}
      {address && operatorOn ? " · key on" : ""}
      {demoOn && !address && !operatorOn ? "" : demoOn ? " · demo" : ""}
    </span>
  );
}
