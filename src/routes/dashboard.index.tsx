import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Kpi, PageHead, Panel, Badge, Table, Td } from "@/components/dashboard/ui";
import {
  BATCH_SIZE,
  fetchLedgerOverview,
  num,
  type LedgerOverview,
  usd,
} from "@/lib/meter-data";
import { useWorkspaceRevision } from "@/components/site/WaitlistForm";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Overview — METER ledger" },
      {
        name: "description",
        content: "Live gross settled volume, METER fee and per-endpoint revenue from the durable ledger.",
      },
    ],
  }),
  component: Overview,
});

const PIE = ["var(--color-primary)", "var(--color-accent)", "var(--color-muted-foreground)", "var(--color-secondary)"];

function Overview() {
  const rev = useWorkspaceRevision();
  const [data, setData] = useState<LedgerOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    fetchLedgerOverview()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [rev]);

  if (error) {
    return (
      <div>
        <PageHead title="Overview" sub="Live ledger unreachable" />
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <PageHead title="Overview" sub="Loading live ledger…" />
      </div>
    );
  }

  const batches24h = Math.ceil((data.calls24h || 0) / BATCH_SIZE) || 0;
  const networkCost24h = Number((batches24h * 0.0004).toFixed(4));
  const netToOperator24h = Number((data.grossVolume24h - data.meterFee24h - networkCost24h).toFixed(2));

  return (
    <div>
      <PageHead
        title="Overview"
        sub={`Live as of ${data.updatedAt} · ${data.endpoints.length} endpoints · ${data.agents.length} agents · cap ${usd(data.dailyCapUsdc)}/day`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Gross settled" value={usd(data.grossVolume24h)} hint={`${num(data.calls24h)} paid calls`} tone="signal" />
        <Kpi label="METER fee" value={usd(data.meterFee24h)} hint={`${(data.takeRate * 100).toFixed(1)}% take rate`} />
        <Kpi label="Network cost" value={usd(networkCost24h)} hint={`${num(batches24h)} batches · ${BATCH_SIZE}/batch`} />
        <Kpi label="Net to operator" value={usd(netToOperator24h)} hint={`${usd(data.openInvoiceTotal)} still open`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Flovia settlement stream" subtitle="Live settled / batched / declined buckets (UTC hour)">
          <div className="h-72">
            {data.settleSeries.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No settled calls in the last 24h yet. Run /demo.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.settleSeries}>
                  <defs>
                    <linearGradient id="gSettled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="t" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="settled" stroke="var(--color-primary)" fill="url(#gSettled)" />
                  <Area type="monotone" dataKey="batched" stroke="var(--color-accent)" fill="transparent" />
                  <Area type="monotone" dataKey="declined" stroke="var(--color-destructive)" fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel title="Revenue by endpoint" subtitle="Derived from live receipts">
          <div className="h-72">
            {data.revenueByEndpoint.every((r) => r.value === 0) ? (
              <p className="p-4 text-sm text-muted-foreground">No revenue yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.revenueByEndpoint} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                    {data.revenueByEndpoint.map((_, i) => (
                      <Cell key={i} fill={PIE[i % PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Agents" subtitle="Funded subaccounts (withdrawals restricted)">
          <Table head={["Agent", "Balance", "Spent 24h", "Status"]}>
            {data.agents.length === 0 && (
              <tr>
                <Td>No agents funded yet.</Td>
                <Td>—</Td>
                <Td>—</Td>
                <Td>—</Td>
              </tr>
            )}
            {data.agents.map((a) => (
              <tr key={a.id}>
                <Td>{a.label}</Td>
                <Td>{usd(a.balance ?? 0)}</Td>
                <Td>{usd(a.spent24h)}</Td>
                <Td>
                  <Badge value={a.status} />
                </Td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="Endpoint rate card" subtitle="Calls + revenue last 24h">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.endpoints}>
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
