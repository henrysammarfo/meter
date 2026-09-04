import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ExternalLink } from "lucide-react";
import { Badge, Kpi, PageHead, Panel, Table, Td } from "@/components/dashboard/ui";
import {
  BATCH_FEE,
  BATCH_SIZE,
  SETTLE_CHAIN,
  batches24h,
  networkCost24h,
  num,
  receipts,
  usd,
} from "@/lib/meter-data";

export const Route = createFileRoute("/dashboard/receipts")({
  head: () => ({
    meta: [
      { title: "Receipts — METER ledger" },
      {
        name: "description",
        content: "Per-call receipts with transaction hash, endpoint, agent and settlement state on BNB Smart Chain.",
      },
    ],
  }),
  component: Receipts,
});

function Receipts() {
  const [q, setQ] = useState("");
  const rows = receipts.filter((r) =>
    `${r.id} ${r.txHash} ${r.endpoint} ${r.agent}`.toLowerCase().includes(q.toLowerCase()),
  );
  const settled = receipts.filter((r) => r.settle === "settled").length;
  const declined = receipts.filter((r) => r.settle === "declined").length;

  return (
    <div>
      <PageHead
        title="Receipts"
        sub={`Every paid call writes one receipt. Receipts are batched ${BATCH_SIZE} at a time and anchored on ${SETTLE_CHAIN}.`}
        action={
          <label className="flex items-center gap-2 rounded-full border border-border px-3.5 py-2 text-sm">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search hash, route, agent"
              className="w-48 bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </label>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Batches 24h" value={num(batches24h)} tone="signal" />
        <Kpi label="Network cost" value={usd(networkCost24h)} hint={`${usd(BATCH_FEE)} per batch`} />
        <Kpi label="Settled (window)" value={String(settled)} />
        <Kpi label="Declined (window)" value={String(declined)} tone={declined ? "danger" : "default"} />
      </div>

      <div className="mt-6">
        <Panel title="Receipt stream" subtitle="Newest first, live from the relay">
          <Table head={["Receipt", "Tx", "Route", "Agent", "Amount", "Time", "State", ""]}>
            {rows.map((r) => (
              <tr key={r.id}>
                <Td mono>{r.id}</Td>
                <Td mono>{r.txHash}</Td>
                <Td mono>{r.endpoint}</Td>
                <Td mono>{r.agent}</Td>
                <Td mono>{usd(r.amount)}</Td>
                <Td mono>{r.time}</Td>
                <Td>
                  <Badge value={r.settle} />
                </Td>
                <Td>
                  <span className="inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    Explorer <ExternalLink className="size-3" />
                  </span>
                </Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <Td>
                  <span className="text-muted-foreground">No receipts match “{q}”.</span>
                </Td>
              </tr>
            )}
          </Table>
        </Panel>
      </div>
    </div>
  );
}
