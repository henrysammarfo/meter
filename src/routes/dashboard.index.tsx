import { createFileRoute } from "@tanstack/react-router";
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
  TAKE_RATE,
  agents,
  batches24h,
  calls24h,
  endpointRevenue,
  grossVolume24h,
  meterFee24h,
  netToOperator24h,
  networkCost24h,
  num,
  openInvoiceTotal,
  revenueByEndpoint,
  settleLatency,
  settleSeries,
  usd,
} from "@/lib/meter-data";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Overview — METER ledger" },
      {
        name: "description",
        content: "Gross settled volume, METER fee, batch costs and per-endpoint revenue for the last 24 hours.",
      },
    ],
  }),
  component: Overview,
});

const PIE = ["var(--color-primary)", "var(--color-accent)", "var(--color-muted-foreground)", "var(--color-secondary)"];

function Overview() {
  return (
    <div>
      <PageHead
        title="Overview"
        sub={`Last 24 hours across ${endpointRevenue.length} metered endpoints and ${agents.length} funded agents.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Gross settled" value={usd(grossVolume24h)} hint={`${num(calls24h)} paid calls`} tone="signal" />
        <Kpi label="METER fee" value={usd(meterFee24h)} hint={`${(TAKE_RATE * 100).toFixed(1)}% take rate`} />
        <Kpi label="Network cost" value={usd(networkCost24h)} hint={`${num(batches24h)} batches · ${BATCH_SIZE}/batch`} />
        <Kpi label="Net to operator" value={usd(netToOperator24h)} hint={`${usd(openInvoiceTotal)} still open`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Flovia settlement stream" subtitle="Calls settled, batched and declined per 3h window">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={settleSeries}>
                <defs>
                  <linearGradient id="gSettled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="t" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="settled" stroke="var(--color-primary)" fill="url(#gSettled)" strokeWidth={2} />
                <Area type="monotone" dataKey="batched" stroke="var(--color-accent)" fill="transparent" strokeWidth={1.5} />
                <Area type="monotone" dataKey="declined" stroke="var(--color-destructive)" fill="transparent" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Revenue mix" subtitle="Share of 24h volume by live endpoint">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={revenueByEndpoint} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
                  {revenueByEndpoint.map((_, i) => (
                    <Cell key={i} fill={PIE[i % PIE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => usd(v)}
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Panel title="Settle latency" subtitle="Time from 402 challenge to receipt">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={settleLatency}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="bucket" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)" }}
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="calls" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Funded agents" subtitle="Balance and 24h burn per agent subaccount">
          <Table head={["Agent", "Owner", "Funded", "Spent 24h", "Status"]}>
            {agents.map((a) => (
              <tr key={a.id}>
                <Td mono>{a.id}</Td>
                <Td>{a.owner}</Td>
                <Td mono>{usd(a.funded)}</Td>
                <Td mono>{usd(a.spent24h)}</Td>
                <Td>
                  <Badge value={a.status} />
                </Td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>
    </div>
  );
}
