import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Waves } from "lucide-react";
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
  BATCH_SIZE,
  SETTLE_ASSET,
  avgPricePerCall,
  calls24h,
  endpointRevenue,
  grossVolume24h,
  num,
  usd,
} from "@/lib/meter-data";

export const Route = createFileRoute("/dashboard/paystream")({
  head: () => ({
    meta: [
      { title: "Paystream — METER ledger" },
      {
        name: "description",
        content: "Rate card, live call volume and per-endpoint revenue for every metered route behind x402.",
      },
    ],
  }),
  component: Paystream,
});

function Paystream() {
  const [filter, setFilter] = useState<"all" | "live" | "paused">("all");
  const rows = endpointRevenue.filter((e) => filter === "all" || e.status === filter);

  return (
    <div>
      <PageHead
        title="Paystream"
        sub={`Your rate card in production. Prices are quoted per unit in ${SETTLE_ASSET} and charged per call at settle time.`}
        action={
          <div className="flex gap-1 rounded-full border border-border p-1 text-xs">
            {(["all", "live", "paused"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 capitalize transition-colors ${
                  filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Volume 24h" value={usd(grossVolume24h)} tone="signal" />
        <Kpi label="Paid calls" value={num(calls24h)} />
        <Kpi label="Avg price / call" value={usd(avgPricePerCall)} />
        <Kpi label="Batch size" value={`${BATCH_SIZE} calls`} hint="Rolled into one on-chain settlement" />
      </div>

      <div className="mt-6 grid gap-6">
        <Panel title="Revenue by endpoint" subtitle="Last 24 hours">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={endpointRevenue.map((e) => ({ name: e.path, revenue: e.revenue24h }))} layout="vertical">
                <CartesianGrid stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} />
                <YAxis type="category" dataKey="name" width={110} stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)" }}
                  formatter={(v: number) => usd(v)}
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="revenue" fill="var(--color-primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Rate card" subtitle="Every route, its unit of account and what it earned">
          <Table head={["Route", "Unit", "Price", "Calls 24h", "Revenue", "p95", "Status"]}>
            {rows.map((e) => (
              <tr key={e.id}>
                <Td mono>{e.path}</Td>
                <Td>{e.unit}</Td>
                <Td mono>{usd(e.pricePerUnit)}</Td>
                <Td mono>{num(e.calls24h)}</Td>
                <Td mono>{usd(e.revenue24h)}</Td>
                <Td mono>{e.p95ms} ms</Td>
                <Td>
                  <Badge value={e.status} />
                </Td>
              </tr>
            ))}
          </Table>
        </Panel>

        <div className="panel flex items-start gap-3 rounded-2xl p-5 text-sm text-muted-foreground">
          <Waves className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            Changing a price takes effect on the next 402 challenge. In-flight vouchers always settle at the price
            they were quoted, so an agent is never charged more than it agreed to.
          </p>
        </div>
      </div>
    </div>
  );
}
