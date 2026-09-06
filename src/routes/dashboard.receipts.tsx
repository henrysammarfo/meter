import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge, Kpi, PageHead, Panel, Table, Td } from "@/components/dashboard/ui";
import { BATCH_FEE, BATCH_SIZE, fetchLedgerOverview, num, type LedgerOverview, usd } from "@/lib/meter-data";
import { useWorkspaceRevision } from "@/components/site/WaitlistForm";

export const Route = createFileRoute("/dashboard/receipts")({
  head: () => ({
    meta: [
      { title: "Receipts — METER ledger" },
      {
        name: "description",
        content: "Per-call receipts with transaction reference, endpoint, agent and settlement state.",
      },
    ],
  }),
  component: Receipts,
});

function Receipts() {
  const rev = useWorkspaceRevision();
  const [q, setQ] = useState("");
  const [data, setData] = useState<LedgerOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLedgerOverview()
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [rev]);

  const receipts = data?.receipts ?? [];
  const rows = useMemo(
    () =>
      receipts.filter((r) =>
        `${r.id} ${r.txHash} ${r.endpoint} ${r.agentId ?? r.agent}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [receipts, q],
  );
  const settled = receipts.filter((r) => r.settle === "settled").length;
  const declined = receipts.filter((r) => r.settle === "declined").length;
  const batches24h = Math.ceil((data?.calls24h ?? 0) / BATCH_SIZE) || 0;

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!data) return <PageHead title="Receipts" sub="Loading…" />;

  return (
    <div>
      <PageHead
        title="Receipts"
        sub={`Shared truth on ${data.settleChainLabel}. Both seller and client agents read the same row.`}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Settled" value={String(settled)} tone="signal" />
        <Kpi label="Declined" value={String(declined)} tone="danger" />
        <Kpi label="Batch estimate" value={String(batches24h)} hint={`${usd(batches24h * BATCH_FEE)} @ ${usd(BATCH_FEE)}/batch`} />
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-full border border-border px-4 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter id, tx, endpoint, agent"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <Panel className="mt-6" title="Receipt feed" subtitle={`${num(rows.length)} visible`}>
        <Table head={["ID", "Tx", "Endpoint", "Agent", "Amount", "Settle"]}>
          {rows.length === 0 && (
            <tr>
              <Td>No receipts yet — run a paid /research call.</Td>
              <Td>—</Td>
              <Td>—</Td>
              <Td>—</Td>
              <Td>—</Td>
              <Td>—</Td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id}>
              <Td>{r.id}</Td>
              <Td mono>{r.txHash}</Td>
              <Td>{r.endpoint}</Td>
              <Td>{r.agentId ?? r.agent}</Td>
              <Td>{usd(r.amount)}</Td>
              <Td>
                <Badge value={r.settle} />
              </Td>
            </tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}
