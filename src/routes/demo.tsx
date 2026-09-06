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

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Live demo — fund, 402, settle, invoice | METER" },
      {
        name: "description",
        content:
          "Run the five-beat METER flow against live /api/v1 endpoints: fund, 402, prepaid settle, invoice, daily cap.",
      },
      { property: "og:title", content: "METER live demo — the whole settle path in five beats" },
      {
        property: "og:description",
        content: "Fund, 402, settle, invoice, limit. Hits real Tavily + TinyFish on paid research.",
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
  const [agentToken, setAgentToken] = useState<string | null>(null);

  const push = useCallback((lines: Omit<LogLine, "id">[]) => {
    setLog((prev) => [...prev, ...lines.map((l, i) => ({ ...l, id: prev.length + i }))]);
  }, []);

  const fee = spent * TAKE_RATE;

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
        setBalance(body.balance);
        if (!body.agentToken) throw new Error("demo seed missing agentToken");
        setAgentToken(body.agentToken);
        push([
          { kind: "chain", text: `funded ${usd(DEMO_FUND_AMOUNT)} ${SETTLE_ASSET} · withdrawalsRestricted=true` },
          { kind: "res", text: `${res.status} { balance: ${body.balance}, cap_24h: ${body.cap_24h} }` },
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
            text: `GET /api/v1/research  X-Meter-Agent-Id: ${DEMO_AGENT}  X-Meter-Payment: prepaid`,
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
        push([{ kind: "req", text: `POST /api/v1/invoices { agentId: "${DEMO_AGENT}" }` }]);
        const res = await fetch("/api/v1/demo/invoice", { method: "POST" });
        const body = await res.json();
        if (!res.ok) throw new Error(body.message ?? JSON.stringify(body));
        setInvoiceId(body.id);
        push([
          {
            kind: "res",
            text: `${body.id} · ${usd(body.amount)} across ${body.calls} calls · fee ${usd(body.takeFee)} (${(TAKE_RATE * 100).toFixed(1)}%)`,
          },
        ]);
        setStep(4);
      } else if (step === 4) {
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
            text: "Limit policy live on ledger — further spend blocked at cap (Binance Agentic Wallet x402 default $20/day).",
          },
        ]);
        setStep(5);
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
    setAgentToken(null);
  }

  const done = step >= 5;

  return (
    <PageShell
      eyebrow="Live demo"
      title="Five beats. Real ledger. Live search."
      lede="Every step calls /api/v1. Research settles only after prepaid debit, then hits Tavily + TinyFish. No animated fake receipts."
    >
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
          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
          {(receiptId || invoiceId) && (
            <p className="mt-3 text-xs text-muted-foreground">
              {receiptId && <>Receipt {receiptId}. </>}
              {invoiceId && <>Invoice {invoiceId}.</>}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="panel grid grid-cols-3 gap-3 p-5">
            <div>
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="font-display text-xl">{usd(balance)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Calls</p>
              <p className="font-display text-xl">{calls}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fee</p>
              <p className="font-display text-xl">{usd(fee)}</p>
            </div>
          </div>
          <div className="panel max-h-[420px] overflow-auto p-4 font-mono text-[11px] leading-relaxed">
            {log.length === 0 && (
              <p className="text-muted-foreground">Awaiting first live request…</p>
            )}
            {log.map((line) => (
              <p
                key={line.id}
                className={
                  line.kind === "warn"
                    ? "text-warning"
                    : line.kind === "chain"
                      ? "text-primary"
                      : line.kind === "req"
                        ? "text-accent"
                        : "text-foreground/80"
                }
              >
                {line.text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
