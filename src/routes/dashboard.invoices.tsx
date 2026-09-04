import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Badge, Kpi, PageHead, Panel, Table, Td } from "@/components/dashboard/ui";
import { fetchLedgerOverview, num, type LedgerOverview, usd } from "@/lib/meter-data";

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
  const [filter, setFilter] = useState<Status>("all");
  const [data, setData] = useState<LedgerOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLedgerOverview()
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  const rows = useMemo(() => {
    const list = data?.invoices ?? [];
    return filter === "all" ? list : list.filter((i) => i.status === filter);
  }, [data, filter]);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!data) return <PageHead title="Invoices" sub="Loading…" />;

  return (
    <div>
      <PageHead
        title="Invoices"
        sub="Issued from unbilled live receipts. Delete the ledger and shared A2A truth disappears."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Open" value={usd(data.openInvoiceTotal)} />
        <Kpi label="Paid" value={usd(data.paidInvoiceTotal)} tone="signal" />
        <Kpi label="Failed" value={usd(data.failedInvoiceTotal)} tone="danger" />
      </div>

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

      <Panel className="mt-6" title="Invoice register" subtitle={`${num(rows.length)} rows · take ${(data.takeRate * 100).toFixed(1)}%`}>
        <Table head={["ID", "Counterparty", "Agent", "Calls", "Amount", "Status"]}>
          {rows.length === 0 && (
            <tr>
              <Td>No invoices yet — finish /demo beat 4.</Td>
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
            </tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}
