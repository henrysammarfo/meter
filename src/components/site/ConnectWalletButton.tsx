import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Wallet, LogOut, KeyRound } from "lucide-react";
import { useWorkspaceRevision } from "@/components/site/WaitlistForm";
import { getOperatorKey } from "@/lib/meter-workspace";
import {
  connectBrowserWallet,
  disconnectBrowserWallet,
  getStoredWalletAddress,
  hasBrowserWallet,
  refreshBrowserWallet,
  shortAddress,
  subscribeWalletAccounts,
} from "@/lib/meter-wallet";

type Props = {
  /** compact = icon-ish chip for nav; full = labeled dashboard control */
  variant?: "nav" | "dashboard" | "hero";
  className?: string;
};

export function ConnectWalletButton({ variant = "nav", className = "" }: Props) {
  const rev = useWorkspaceRevision();
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const operatorOn = Boolean(getOperatorKey());

  useEffect(() => {
    setAddress(getStoredWalletAddress());
    void refreshBrowserWallet().then(setAddress);
    return subscribeWalletAccounts(setAddress);
  }, [rev]);

  async function onConnect() {
    setBusy(true);
    setError(null);
    try {
      const next = await connectBrowserWallet();
      setAddress(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function onDisconnect() {
    disconnectBrowserWallet();
    setAddress("");
    setError(null);
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

  const label =
    variant === "hero"
      ? "Connect wallet"
      : hasBrowserWallet()
        ? "Connect wallet"
        : "Connect wallet";

  return (
    <div className={`flex flex-col items-end gap-1 ${className}`}>
      <button
        type="button"
        disabled={busy}
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
        {busy ? "Connecting…" : label}
      </button>
      {error && (
        <p className="max-w-[16rem] text-right text-[0.65rem] text-destructive">{error}</p>
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
  const operatorOn = Boolean(getOperatorKey());

  useEffect(() => {
    setAddress(getStoredWalletAddress());
  }, [rev]);

  if (!address && !operatorOn) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[0.65rem] text-warning">
        <span className="size-1.5 rounded-full bg-warning" />
        Not signed in
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[0.65rem] text-primary">
      <span className="size-1.5 rounded-full bg-primary" />
      {address ? shortAddress(address) : "Operator key"}
      {address && operatorOn ? " · key on" : ""}
    </span>
  );
}
