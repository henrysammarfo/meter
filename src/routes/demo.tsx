import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
  SETTLE_CHAIN,
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
          "Run the five-beat METER flow: fund an agent subaccount, hit a 402 paywalled endpoint, settle over x402, watch the invoice appear and the daily limit bite.",
      },
      { property: "og:title", content: "METER live demo — the whole settle path in five beats" },
      {
        property: "og:description",
        content: "Fund, 402, settle, invoice, limit. Every beat priced off the METER rate card.",
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
  { key: "limit", label: "Limit hit", icon: Gauge },
] as const;

function DemoPage() {
  const [step, setStep] = useState(0);
  const [balance, setBalance] = useState(0);
  const [calls, setCalls] = useState(0);
  const [spent, setSpent] = useState(0);
  const [log, setLog] = useState<LogLine[]>([]);

  const push = (lines: Omit<LogLine, "id">[]) =>
    setLog((prev) => [...prev, ...lines.map((l, i) => ({ ...l, id: prev.length + i }))]);

  const fee = spent * TAKE_RATE;

  function next() {
    if (step === 0) {
      setBalance(DEMO_FUND_AMOUNT);
      push([
        { kind: "req", text: `POST /v1/subaccounts { agent: "${DEMO_AGENT}" }` },
        { kind: "chain", text: `funded ${usd(DEMO_FUND_AMOUNT)} ${SETTLE_ASSET} on ${SETTLE_CHAIN}` },
        { kind: "res", text: `201 { balance: ${DEMO_FUND_AMOUNT}, cap_24h: ${DEMO_DAILY_CAP} }` },
      ]);
    } else if (step === 1) {
      push([
        { kind: "req", text: `GET /research?q=bnb+agent+os  (no payment header)` },
        { kind: "res", text: `402 Payment Required` },
        {
          kind: "res",
          text: `WWW-Authenticate: x402 price=${DEMO_CALL_PRICE} asset=${SETTLE_ASSET} network=bsc`,
        },
      ]);
    } else if (step === 2) {
      const batch = 4;
      setCalls(batch);
      setSpent(batch * DEMO_CALL_PRICE);
      setBalance(DEMO_FUND_AMOUNT - batch * DEMO_CALL_PRICE);
      push([
        { kind: "req", text: `GET /research  X-PAYMENT: <x402 voucher ${usd(DEMO_CALL_PRICE)}>` },
        { kind: "res", text: `200 OK — 4 paid calls served` },
        { kind: "chain", text: `receipt rc_90001…90004 · settled ${usd(batch * DEMO_CALL_PRICE)}` },
      ]);
    } else if (step === 3) {
      push([
        { kind: "req", text: `meter.invoices.issue({ agent: "${DEMO_AGENT}", window: "24h" })` },
        {
          kind: "res",
          text: `INV-DEMO-01 · ${usd(spent)} across ${calls} calls · fee ${usd(fee)} (${(TAKE_RATE * 100).toFixed(1)}%)`,
        },
      ]);
    } else if (step === 4) {
      const extra = Math.max(0, DEMO_DAILY_CAP - spent);
      const extraCalls = Math.floor(extra / DEMO_CALL_PRICE);
      const totalCalls = calls + extraCalls;
      setCalls(totalCalls);
      setSpent(totalCalls * DEMO_CALL_PRICE);
      setBalance(DEMO_FUND_AMOUNT - totalCalls * DEMO_CALL_PRICE);
      push([
        { kind: "req", text: `GET /research × ${extraCalls + 1} (burst)` },
        { kind: "warn", text: `429 limit_exceeded — daily cap ${usd(DEMO_DAILY_CAP)} reached` },
        {
          kind: "res",
          text: `graceful failure: last call queued, agent throttled, balance ${usd(DEMO_FUND_AMOUNT - totalCalls * DEMO_CALL_PRICE)} untouched`,
        },
      ]);
    }
    setStep((s) => Math.min(s + 1, BEATS.length));
  }

  function reset() {
    setStep(0);
    setBalance(0);
    setCalls(0);
    setSpent(0);
    setLog([]);
  }

  return (
    <PageShell
      eyebrow="Live demo"
      title="Five beats from funded agent to auditable ledger."
      lede="Nothing is faked past the network layer — every number below is priced off the same METER rate card the dashboard reads."
    >
      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <section className="panel rounded-2xl p-5 sm:p-7">
          <ol className="space-y-3">
            {BEATS.map((b, i) => {
              const done = step > i;
              const active = step === i;
              const Icon = b.icon;
              return (
                <li
                  key={b.key}
                  className={`flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-colors ${
                    active
                      ? "border-primary/50 bg-primary/10"
                      : done
                        ? "border-border bg-card/60"
                        : "border-border/60 bg-transparent opacity-60"
                  }`}
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                      done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="size-4" /> : <Icon className="size-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {i + 1}. {b.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {b.key === "fund" && `Deposit ${usd(DEMO_FUND_AMOUNT)} ${SETTLE_ASSET} into ${DEMO_AGENT}.`}
                      {b.key === "challenge" && "Unpaid call returns an x402 challenge with the price."}
                      {b.key === "settle" && `Voucher attached, ${usd(DEMO_CALL_PRICE)} per call, receipts written.`}
                      {b.key === "invoice" && `Rolled into an invoice with the ${(TAKE_RATE * 100).toFixed(1)}% METER fee.`}
                      {b.key === "limit" && `Daily cap ${usd(DEMO_DAILY_CAP)} trips and the agent throttles cleanly.`}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-6 flex flex-wrap gap-3">
            {step < BEATS.length ? (
              <button
                onClick={next}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Run beat {step + 1} <ArrowRight className="size-4" />
              </button>
            ) : (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                <BarChart3 className="size-4" /> See it in the ledger
              </Link>
            )}
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm transition-colors hover:bg-card"
            >
              <RotateCcw className="size-4" /> Reset
            </button>
          </div>
        </section>

        <div className="space-y-6">
          <section className="panel rounded-2xl p-5 sm:p-6">
            <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">Agent state</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Stat label="Balance" value={usd(balance)} />
              <Stat label="Paid calls" value={String(calls)} />
              <Stat label="Spent" value={usd(spent)} />
              <Stat label="METER fee" value={usd(fee)} />
            </div>
            <div className="mt-5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Daily cap</span>
                <span className="font-mono">
                  {usd(spent)} / {usd(DEMO_DAILY_CAP)}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    spent >= DEMO_DAILY_CAP ? "bg-destructive" : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(100, (spent / DEMO_DAILY_CAP) * 100)}%` }}
                />
              </div>
            </div>
          </section>

          <section className="panel rounded-2xl p-5 sm:p-6">
            <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">Wire log</p>
            <div className="mt-4 max-h-80 space-y-1.5 overflow-auto font-mono text-[11.5px] leading-relaxed">
              {log.length === 0 && <p className="text-muted-foreground">Idle. Run beat 1 to begin.</p>}
              {log.map((l) => (
                <p
                  key={l.id}
                  className={
                    l.kind === "warn"
                      ? "text-destructive"
                      : l.kind === "chain"
                        ? "text-primary"
                        : l.kind === "req"
                          ? "text-foreground/85"
                          : "text-muted-foreground"
                  }
                >
                  <span className="opacity-50">{l.kind === "req" ? "→" : l.kind === "warn" ? "!" : "←"}</span>{" "}
                  {l.text}
                </p>
              ))}
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display mt-1 text-2xl">{value}</p>
    </div>
  );
}
