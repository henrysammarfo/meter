import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge, Kpi, PageHead, Panel, Table, Td } from "@/components/dashboard/ui";
import {
  MeterApiError,
  quoteResearch,
  runPrepaidResearch,
  type ResearchQuote,
} from "@/lib/meter-api";
import {
  DEMO_AGENT,
  fetchLedgerOverview,
  num,
  SETTLE_ASSET,
  type LedgerOverview,
  usd,
} from "@/lib/meter-data";
import { getAgentToken } from "@/lib/meter-workspace";
import { useWorkspaceRevision } from "@/components/site/WaitlistForm";

export const Route = createFileRoute("/dashboard/paystream")({
  head: () => ({
    meta: [
      { title: "Paystream — METER ledger" },
      {
        name: "description",
        content: "Rate card, quote preview, and live call volume for every metered route behind x402.",
      },
    ],
  }),
  component: Paystream,
});

function Paystream() {
  const rev = useWorkspaceRevision();
  const [filter, setFilter] = useState<"all" | "live" | "paused">("all");
  const [data, setData] = useState<LedgerOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agentId, setAgentId] = useState(DEMO_AGENT);
  const [quote, setQuote] = useState<ResearchQuote | null>(null);
  const [quoteMsg, setQuoteMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<"quote" | "pay" | null>(null);

  useEffect(() => {
    fetchLedgerOverview()
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [rev]);

  const rows = useMemo(() => {
    const list = data?.endpoints ?? [];
    return filter === "all" ? list : list.filter((e) => e.status === filter);
  }, [data, filter]);

  async function onQuote() {
    setBusy("quote");
    setQuoteMsg(null);
    try {
      if (!getAgentToken(agentId.trim())) {
        throw new Error("No agent token in vault for this id — run /demo or fund in Settings");
      }
      const { data: q } = await quoteResearch(agentId.trim());
      setQuote(q);
      setQuoteMsg(q.message);
    } catch (e) {
      setQuote(null);
      setQuoteMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function onPay() {
    setBusy("pay");
    setQuoteMsg(null);
    try {
      if (!getAgentToken(agentId.trim())) {
        throw new Error("No agent token in vault for this id");
      }
      const { status, data: body } = await runPrepaidResearch(
        agentId.trim(),
        "METER paystream quote convert",
      );
      setQuoteMsg(`${status} receipt=${body.receiptId ?? "n/a"} providers=${(body.providers ?? []).join("+")}`);
      const next = await fetchLedgerOverview();
      setData(next);
      const { data: q } = await quoteResearch(agentId.trim());
      setQuote(q);
    } catch (e) {
      if (e instanceof MeterApiError) {
        setQuoteMsg(`${e.status} ${e.body.error ?? ""} — ${e.message}`);
      } else {
        setQuoteMsg(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setBusy(null);
    }
  }

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!data) return <PageHead title="Paystream" sub="Loading…" />;

  const avg = data.calls24h ? data.grossVolume24h / data.calls24h : 0;

  return (
    <div>
      <PageHead
        title="Paystream"
        sub={`Metered endpoints settle in ${SETTLE_ASSET}. Quote → convert (prepaid) like a swap preview.`}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Gross 24h" value={usd(data.grossVolume24h)} tone="signal" />
        <Kpi label="Calls 24h" value={num(data.calls24h)} />
        <Kpi label="Avg price" value={usd(avg)} />
      </div>

      <Panel
        className="mt-6"
        title="Quote → convert"
        subtitle="GET /api/v1/research/quote then prepaid research. Shows insufficient balance / cap before you spend."
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
            placeholder="agent id"
          />
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void onQuote()}
            className="rounded-full border border-border px-5 py-2 text-sm disabled:opacity-50"
          >
            {busy === "quote" ? "Quoting…" : "Quote"}
          </button>
          <button
            type="button"
            disabled={busy !== null || (quote != null && !quote.canAfford)}
            onClick={() => void onPay()}
            className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            {busy === "pay" ? "Settling…" : "Convert / pay"}
          </button>
        </div>
        {quote && (
          <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-4">
            <p>
              Price <span className="font-mono text-foreground">{usd(quote.priceUsdc)}</span>
            </p>
            <p>
              Balance <span className="font-mono text-foreground">{usd(quote.balance)}</span>
            </p>
            <p>
              Cap left{" "}
              <span className="font-mono text-foreground">{usd(quote.workspaceRemaining)}</span>
            </p>
            <p>
              Next <span className="font-mono text-primary">{quote.next}</span>
            </p>
          </div>
        )}
        {quoteMsg && <p className="mt-2 text-xs text-muted-foreground">{quoteMsg}</p>}
        {!getAgentToken(DEMO_AGENT) && (
          <p className="mt-2 text-xs text-muted-foreground">
            No demo token yet —{" "}
            <Link to="/demo" className="text-primary hover:underline">
              run /demo
            </Link>{" "}
            to mint one into the vault.
          </p>
        )}
      </Panel>

      <div className="mt-4 flex gap-2">
        {(["all", "live", "paused"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 text-xs ${filter === s ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Rate card" subtitle="Live status from ledger">
          <Table head={["Path", "Unit", "Price", "Calls", "Revenue", "Status"]}>
            {rows.map((e) => (
              <tr key={e.id}>
                <Td>{e.path}</Td>
                <Td>{e.unit}</Td>
                <Td>{usd(e.pricePerUnit)}</Td>
                <Td>{num(e.calls24h)}</Td>
                <Td>{usd(e.revenue24h ?? 0)}</Td>
                <Td>
                  <Badge value={e.status} />
                </Td>
              </tr>
            ))}
          </Table>
        </Panel>
        <Panel title="Revenue bars" subtitle="Last 24h (workspace filter)">
          <div className="h-72">
            {rows.every((e) => (e.revenue24h ?? 0) === 0) ? (
              <p className="p-4 text-sm text-muted-foreground">No revenue in window yet. Quote → convert or run /demo.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="path" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="revenue24h" fill="var(--color-primary)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
