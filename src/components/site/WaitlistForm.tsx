import { useCallback, useEffect, useState, type FormEvent } from "react";
import { joinWaitlist } from "@/lib/meter-api";

type Props = {
  source: string;
  cta?: string;
  placeholder?: string;
  className?: string;
};

/** Shared waitlist email form — hits live POST /api/v1/waitlist. */
export function WaitlistForm({
  source,
  cta = "Join waitlist",
  placeholder = "you@company.com",
  className = "",
}: Props) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      if (!email.trim() || busy) return;
      setBusy(true);
      setError(null);
      try {
        await joinWaitlist(email, source);
        setJoined(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusy(false);
      }
    },
    [email, busy, source],
  );

  return (
    <form onSubmit={(e) => void submit(e)} className={`space-y-2 ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          disabled={joined}
          className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={busy || joined}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Joining…" : joined ? "You're in" : cta}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  );
}

export function useWorkspaceRevision() {
  const [rev, setRev] = useState(0);
  useEffect(() => {
    const onChange = () => setRev((n) => n + 1);
    window.addEventListener("meter-workspace-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("meter-workspace-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return rev;
}
