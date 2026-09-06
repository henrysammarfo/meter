import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Kpi, PageHead, Panel, Table, Td } from "@/components/dashboard/ui";
import { issueInvoice, markInvoicePaid } from "@/lib/meter-api";
import { fetchLedgerOverview, num, type LedgerOverview, usd } from "@/lib/meter-data";
import { getOperatorKey } from "@/lib/meter-workspace";
import { useWorkspaceRevision } from "@/components/site/WaitlistForm";

export const Route = createFileRoute("/dashboard/invoices")({
  head: () => ({
    meta: [
      { title: "Invoices — METER ledger" },
      {
        name: "description",
        content: "Agent-to-agent invoices rolled up from settled calls on the live ledger.",
      },
    ],
  }),
  component: Invoices,
});

type Status = "all" | "paid" | "open" | "failed";

function Invoices() {
  const rev = useWorkspaceRevision();
  const [filter, setFilter] = useState<Status>("all");
  const [data, setData] = useState<LedgerOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [issueAgent, setIssueAgent] = useState("");
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const reload = useCallback(() => {
    fetchLedgerOverview()
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    reload();
  }, [reload, rev]);

  const rows = useMemo(() => {
    const list = data?.invoices ?? [];
    return filter === "all" ? list : list.filter((i) => i.status === filter);
  }, [data, filter]);

  async function onMarkPaid(id: string) {
    setBusyId(id);
    setActionMsg(null);
    try {
      if (!getOperatorKey()) {
        throw new Error("Save an operator key in Settings first");
      }
      await markInvoicePaid(id);
      setActionMsg(`Marked ${id} paid`);
      reload();
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  async function onIssue() {
    setActionMsg(null);
    try {
      if (!getOperatorKey()) throw new Error("Save an operator key in Settings first");
      const agentId = issueAgent.trim();
      if (!agentId) throw new Error("Agent id required");
      const { data: inv } = await issueInvoice(agentId);
      setActionMsg(`Issued ${(inv as { id?: string }).id ?? "invoice"} for ${agentId}`);
      setIssueAgent("");
      reload();
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : String(e));
    }
  }

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!data) return <PageHead title="Invoices" sub="Loading…" />;

  return (
    <div>
      <PageHead
        title="Invoices"
        sub="Issued from unbilled live receipts. Mark paid via POST /api/v1/invoices/:id/pay."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Open" value={usd(data.openInvoiceTotal)} />
        <Kpi label="Paid" value={usd(data.paidInvoiceTotal)} tone="signal" />
        <Kpi label="Failed" value={usd(data.failedInvoiceTotal)} tone="danger" />
      </div>

      <Panel className="mt-6" title="Issue invoice" subtitle="Rolls unbilled receipts for an agent">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={issueAgent}
            onChange={(e) => setIssueAgent(e.target.value)}
            placeholder="agent id"
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => void onIssue()}
            className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground"
          >
            Issue
          </button>
        </div>
        {actionMsg && <p className="mt-2 text-xs text-muted-foreground">{actionMsg}</p>}
      </Panel>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["all", "open", "paid", "failed"] as Status[]).map((s) => (
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

      <Panel
        className="mt-6"
        title="Invoice register"
        subtitle={`${num(rows.length)} rows · take ${(data.takeRate * 100).toFixed(1)}%`}
      >
        <Table head={["ID", "Counterparty", "Agent", "Calls", "Amount", "Status", ""]}>
          {rows.length === 0 && (
            <tr>
              <Td>No invoices yet — finish /demo beat 4 or issue above.</Td>
              <Td>—</Td>
              <Td>—</Td>
              <Td>—</Td>
              <Td>—</Td>
              <Td>—</Td>
              <Td>—</Td>
            </tr>
          )}
          {rows.map((inv) => (
            <tr key={inv.id}>
              <Td>{inv.id}</Td>
              <Td>{inv.counterparty}</Td>
              <Td>{inv.agentId ?? inv.agent}</Td>
              <Td>{inv.calls}</Td>
              <Td>{usd(inv.amount)}</Td>
              <Td>
                <Badge value={inv.status} />
              </Td>
              <Td>
                {inv.status === "open" ? (
                  <button
                    type="button"
                    disabled={busyId === inv.id}
                    onClick={() => void onMarkPaid(inv.id)}
                    className="text-xs text-primary hover:underline disabled:opacity-50"
                  >
                    {busyId === inv.id ? "…" : "Mark paid"}
                  </button>
                ) : (
                  "—"
                )}
              </Td>
            </tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}
