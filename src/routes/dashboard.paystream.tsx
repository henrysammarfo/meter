import { createFileRoute } from "@tanstack/react-router";
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
import { fetchLedgerOverview, num, SETTLE_ASSET, type LedgerOverview, usd } from "@/lib/meter-data";
import { useWorkspaceRevision } from "@/components/site/WaitlistForm";

export const Route = createFileRoute("/dashboard/paystream")({
  head: () => ({
    meta: [
      { title: "Paystream — METER ledger" },
      {
        name: "description",
        content: "Rate card and live call volume for every metered route behind x402.",
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

  useEffect(() => {
    fetchLedgerOverview()
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [rev]);

  const rows = useMemo(() => {
    const list = data?.endpoints ?? [];
    return filter === "all" ? list : list.filter((e) => e.status === filter);
  }, [data, filter]);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!data) return <PageHead title="Paystream" sub="Loading…" />;

  const avg = data.calls24h ? data.grossVolume24h / data.calls24h : 0;

  return (
    <div>
      <PageHead
        title="Paystream"
        sub={`Metered endpoints settle in ${SETTLE_ASSET}. Price × units → 402 → receipt.`}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Gross 24h" value={usd(data.grossVolume24h)} tone="signal" />
        <Kpi label="Calls 24h" value={num(data.calls24h)} />
        <Kpi label="Avg price" value={usd(avg)} />
      </div>

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
        <Panel title="Revenue bars" subtitle="Last 24h">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="path" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="revenue24h" fill="var(--color-primary)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}
