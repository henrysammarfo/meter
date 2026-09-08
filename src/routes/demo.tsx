import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import {
  Wallet,
  ShieldAlert,
  Receipt as ReceiptIcon,
  FileText,
  Gauge,
  BarChart3,
  Check,
  ArrowRight,
  RotateCcw,
  Ban,
  ExternalLink,
} from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import {
  DEMO_AGENT,
  DEMO_CALL_PRICE,
  DEMO_DAILY_CAP,
  DEMO_FUND_AMOUNT,
  SETTLE_ASSET,
  TAKE_RATE,
  usd,
} from "@/lib/meter-data";
import { addAgentToWorkspace, setActiveWorkspace, setAgentToken } from "@/lib/meter-workspace";
import { touchSession } from "@/lib/meter-session";

/** Contest demo recording (Track A submit). */
export const DEMO_VIDEO_URL = "https://youtu.be/eqBMozL5CgU";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Live demo — fund, 402, settle, invoice | METER" },
      {
        name: "description",
        content:
          "Run the live METER flow against /api/v1: fund, 402, prepaid settle, invoice, insufficient balance, daily cap.",
      },
      { property: "og:title", content: "METER live demo — the whole settle path" },
      {
        property: "og:description",
        content: "Fund, 402, settle, invoice, balance gate, limit. Real Tavily + TinyFish on paid research.",
      },
    ],
  }),
  component: DemoPage,
});

type LogLine = { id: number; kind: "req" | "res" | "chain" | "warn"; text: string };

const BEATS = [
  { key: "fund", label: "Fund subaccount", icon: Wallet },
  { key: "challenge", label: "402 challenge", icon: ShieldAlert },
  { key: "settle", label: "Settle + receipt", icon: ReceiptIcon },
  { key: "invoice", label: "Invoice issued", icon: FileText },
  { key: "balance", label: "Insufficient balance", icon: Ban },
  { key: "limit", label: "Limit policy", icon: Gauge },
] as const;

function DemoPage() {
  const [step, setStep] = useState(0);
  const [balance, setBalance] = useState(0);
  const [calls, setCalls] = useState(0);
  const [spent, setSpent] = useState(0);
  const [log, setLog] = useState<LogLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [agentToken, setAgentTokenState] = useState<string | null>(null);

  const push = useCallback((lines: Omit<LogLine, "id">[]) => {
    setLog((prev) => [...prev, ...lines.map((l, i) => ({ ...l, id: prev.length + i }))]);
  }, []);

  const fee = spent * TAKE_RATE;

  function persistDemoSession(token: string) {
    setAgentToken(DEMO_AGENT, token);
    addAgentToWorkspace("ws_public_demo", DEMO_AGENT);
    setActiveWorkspace("ws_public_demo");
    touchSession();
  }

  async function next() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (step === 0) {
        push([{ kind: "req", text: `POST /api/v1/demo/seed { agent: "${DEMO_AGENT}", amount: ${DEMO_FUND_AMOUNT} }` }]);
        const res = await fetch("/api/v1/demo/seed", { method: "POST" });
        const body = await res.json();
        if (!res.ok) throw new Error(body.message ?? JSON.stringify(body));
        setBalance(body.balance ?? body.agent?.balance ?? DEMO_FUND_AMOUNT);
        if (!body.agentToken) throw new Error("demo seed missing agentToken");
        setAgentTokenState(body.agentToken);
        persistDemoSession(body.agentToken);
        const bal = body.balance ?? body.agent?.balance;
        const cap = body.cap_24h ?? body.dailyCapUsdc ?? DEMO_DAILY_CAP;
        push([
          { kind: "chain", text: `funded ${usd(DEMO_FUND_AMOUNT)} ${SETTLE_ASSET} · withdrawalsRestricted=true` },
          { kind: "res", text: `${res.status} { balance: ${bal}, dailyCap: ${cap}, agentToken: saved to vault }` },
        ]);
        setStep(1);
      } else if (step === 1) {
        push([{ kind: "req", text: `GET /api/v1/research?q=bnb+agent+os  (no payment header)` }]);
        const res = await fetch("/api/v1/research?q=" + encodeURIComponent("Binance Agent OS x402"));
        const body = await res.json();
        push([
          { kind: "res", text: `${res.status} ${res.status === 402 ? "Payment Required" : JSON.stringify(body).slice(0, 120)}` },
        ]);
        if (res.status !== 402) {
          throw new Error("Expected HTTP 402 without payment credentials");
        }
        const price = body?.paymentRequired?.accepts?.[0]?.maxAmountRequired;
        push([
          {
            kind: "res",
            text: `PAYMENT-REQUIRED present · atomic max=${price ?? "n/a"} · schemes=${(body?.paymentRequired?.accepts ?? []).map((a: { scheme: string }) => a.scheme).join(",")}`,
          },
        ]);
        setStep(2);
      } else if (step === 2) {
        push([
          {
            kind: "req",
            text: `GET /api/v1/research/quote  then prepaid research`,
          },
        ]);
        const quoteRes = await fetch("/api/v1/research/quote", {
          headers: {
            "X-Meter-Agent-Id": DEMO_AGENT,
            "X-Meter-Agent-Token": agentToken ?? "",
          },
        });
        const quote = await quoteRes.json();
        if (!quoteRes.ok) throw new Error(quote.message ?? JSON.stringify(quote));
        push([
          {
            kind: "res",
            text: `quote ${quoteRes.status} · next=${quote.next} · balance=${quote.balance} · price=${quote.priceUsdc}`,
          },
        ]);
        const res = await fetch(
          "/api/v1/research?q=" + encodeURIComponent("Binance Agent OS x402 daily limit"),
          {
            headers: {
              "X-Meter-Agent-Id": DEMO_AGENT,
              "X-Meter-Agent-Token": agentToken ?? "",
              "X-Meter-Payment": "prepaid",
            },
          },
        );
        const body = await res.json();
        if (!res.ok) throw new Error(body.message ?? JSON.stringify(body));
        setCalls(1);
        setSpent(DEMO_CALL_PRICE);
        setBalance((b) => Number((b - DEMO_CALL_PRICE).toFixed(6)));
        setReceiptId(body.receiptId);
        push([
          { kind: "res", text: `200 OK — live providers: ${(body.providers ?? []).join("+")}` },
          { kind: "chain", text: `receipt ${body.receiptId} · settled ${usd(DEMO_CALL_PRICE)} · sources=${body.sources?.length ?? 0}` },
        ]);
        setStep(3);
      } else if (step === 3) {
        push([{ kind: "req", text: `POST /api/v1/demo/invoice  (public demo issuer for ${DEMO_AGENT})` }]);
        const res = await fetch("/api/v1/demo/invoice", { method: "POST" });
        const body = await res.json();
        if (!res.ok) throw new Error(body.message ?? JSON.stringify(body));
        setInvoiceId(body.id);
        push([
          {
            kind: "res",
            text: `${body.id} · ${usd(body.amount)} across ${body.calls} calls · fee ${usd(body.takeFee ?? body.amount * TAKE_RATE)} · status=${body.status ?? "open"}`,
          },
        ]);
        // Demo mark-paid without operator key
        const payRes = await fetch("/api/v1/demo/invoice/pay", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: body.id }),
        });
        const payBody = await payRes.json();
        if (!payRes.ok) throw new Error(payBody.message ?? JSON.stringify(payBody));
        push([{ kind: "chain", text: `POST /api/v1/demo/invoice/pay → ${payRes.status} status=${payBody.status}` }]);
        setStep(4);
      } else if (step === 4) {
        push([{ kind: "req", text: `POST /api/v1/demo/drain then prepaid research (expect INSUFFICIENT_BALANCE)` }]);
        const drainRes = await fetch("/api/v1/demo/drain", {
          method: "POST",
          headers: { "X-Meter-Agent-Token": agentToken ?? "" },
        });
        const drainBody = await drainRes.json();
        if (!drainRes.ok) throw new Error(drainBody.message ?? JSON.stringify(drainBody));
        setBalance(0);
        push([{ kind: "res", text: `${drainRes.status} balance=${drainBody.balance}` }]);
        const res = await fetch(
          "/api/v1/research?q=" + encodeURIComponent("should fail insufficient"),
          {
            headers: {
              "X-Meter-Agent-Id": DEMO_AGENT,
              "X-Meter-Agent-Token": agentToken ?? "",
              "X-Meter-Payment": "prepaid",
            },
          },
        );
        const body = await res.json();
        push([
          {
            kind: "warn",
            text: `${res.status} ${body.error ?? ""} — ${body.message ?? JSON.stringify(body).slice(0, 160)}`,
          },
        ]);
        if (res.status !== 402 || body.error !== "INSUFFICIENT_BALANCE") {
          throw new Error(`Expected 402 INSUFFICIENT_BALANCE, got ${res.status} ${body.error}`);
        }
        setStep(5);
      } else if (step === 5) {
        push([{ kind: "req", text: `GET /api/v1/limits` }]);
        const res = await fetch("/api/v1/limits");
        const body = await res.json();
        if (!res.ok) throw new Error(body.message ?? JSON.stringify(body));
        const daily = (body.limits ?? []).find((l: { id: string }) => l.id === "lm_daily");
        push([
          {
            kind: "warn",
            text: `workspace daily cap ${usd(daily?.cap ?? DEMO_DAILY_CAP)} · used ${usd(daily?.used ?? spent)} · action=${daily?.action ?? "block"}`,
          },
          {
            kind: "res",
            text: "Limit policy live — further spend blocked at cap (x402-style $20/day). Re-seed anytime for another run.",
          },
        ]);
        setStep(6);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      push([{ kind: "warn", text: msg }]);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setStep(0);
    setBalance(0);
    setCalls(0);
    setSpent(0);
    setLog([]);
    setError(null);
    setReceiptId(null);
    setInvoiceId(null);
    setAgentTokenState(null);
  }

  const done = step >= 6;

  return (
    <PageShell
      eyebrow="Live demo"
      title="Six beats. Real ledger. Live search."
      lede="Every step calls /api/v1. Quote → prepaid settle → invoice pay → insufficient balance gate. No animated fake receipts. No mainnet deposit required."
    >
      <p className="mb-6 text-sm text-muted-foreground">
        Prefer the recording?{" "}
        <a
          href={DEMO_VIDEO_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          Watch the contest demo <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </p>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <ol className="space-y-3">
            {BEATS.map((beat, i) => {
              const Icon = beat.icon;
              const active = i === step;
              const complete = i < step;
              return (
                <li
                  key={beat.key}
                  className={`panel flex items-center gap-4 p-4 ${active ? "ring-1 ring-primary/60" : ""}`}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${complete ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                  >
                    {complete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{beat.label}</p>
                    <p className="text-xs text-muted-foreground">Beat {i + 1}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-6 flex flex-wrap gap-3">
            {!done ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void next()}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {busy ? "Running…" : step === 0 ? "Start live flow" : "Next beat"}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
              >
                Open ledger <BarChart3 className="h-4 w-4" />
              </Link>
            )}
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>

        <div className="space-y-4">
          <div className="panel grid grid-cols-3 gap-3 p-4">
            <div>
              <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">Balance</p>
              <p className="font-mono text-lg text-primary">{usd(balance)}</p>
            </div>
            <div>
              <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">Calls</p>
              <p className="font-mono text-lg">{calls}</p>
            </div>
            <div>
              <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">Fee</p>
              <p className="font-mono text-lg">{usd(fee)}</p>
            </div>
          </div>
          {(receiptId || invoiceId) && (
            <div className="panel space-y-1 p-4 text-xs text-muted-foreground">
              {receiptId && <p>Receipt: <span className="font-mono text-foreground">{receiptId}</span></p>}
              {invoiceId && <p>Invoice: <span className="font-mono text-foreground">{invoiceId}</span></p>}
            </div>
          )}
          <div className="panel h-[28rem] overflow-auto p-4 font-mono text-[0.7rem] leading-relaxed">
            {log.length === 0 ? (
              <p className="text-muted-foreground">Awaiting first live request…</p>
            ) : (
              log.map((l) => (
                <p
                  key={l.id}
                  className={
                    l.kind === "warn"
                      ? "text-warning"
                      : l.kind === "chain"
                        ? "text-primary"
                        : l.kind === "req"
                          ? "text-muted-foreground"
                          : "text-foreground"
                  }
                >
                  {l.text}
                </p>
              ))
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
