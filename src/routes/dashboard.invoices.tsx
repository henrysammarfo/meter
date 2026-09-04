import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { Badge, Kpi, PageHead, Panel, Table, Td } from "@/components/dashboard/ui";
import {
  TAKE_RATE,
  agentSpendSeries,
  failedInvoiceTotal,
  invoices,
  num,
  openInvoiceTotal,
  paidInvoiceTotal,
  usd,
} from "@/lib/meter-data";

export const Route = createFileRoute("/dashboard/invoices")({
  head: () => ({
    meta: [
      { title: "Invoices — METER ledger" },
      {
        name: "description",
        content: "Agent-to-agent invoices rolled up from settled calls, with fee, status and counterparty.",
      },
    ],
  }),
  component: Invoices,
});

type Status = "all" | "paid" | "open" | "failed";

function Invoices() {
  const [status, setStatus] = useState<Status>("all");
  const rows = invoices.filter((i) => status === "all" || i.status === status);
  const totalCalls = invoices.reduce((s, i) => s + i.calls, 0);

  return (
    <div>
      <PageHead
        title="Invoices"
        sub="Settled calls are rolled into one invoice per counterparty per window. The METER fee is itemised on every line."
        action={
          <div className="flex gap-1 rounded-full border border-border p-1 text-xs">
            {(["all", "paid", "open", "failed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-full px-3 py-1.5 capitalize transition-colors ${
                  status === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Paid" value={usd(paidInvoiceTotal)} tone="signal" />
        <Kpi label="Open" value={usd(openInvoiceTotal)} hint="Net 7 terms" />
        <Kpi label="Failed" value={usd(failedInvoiceTotal)} tone="danger" hint="Retry on next settle window" />
        <Kpi label="Billed calls" value={num(totalCalls)} />
      </div>

      <div className="mt-6 grid gap-6">
        <Panel title="Spend per counterparty" subtitle="Rolling 7 days, USDC">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={agentSpendSeries}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="d" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(v: number) => usd(v)}
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="northwind" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="kite" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="halo" stroke="var(--color-muted-foreground)" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="solon" stroke="var(--color-destructive)" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="All invoices" subtitle={`METER fee applied at ${(TAKE_RATE * 100).toFixed(1)}% of settled volume`}>
          <Table head={["Invoice", "Counterparty", "Agent", "Calls", "Amount", "Fee", "Issued", "Due", "Status"]}>
            {rows.map((i) => (
              <tr key={i.id}>
                <Td mono>{i.id}</Td>
                <Td>{i.counterparty}</Td>
                <Td mono>{i.agent}</Td>
                <Td mono>{num(i.calls)}</Td>
                <Td mono>{usd(i.amount)}</Td>
                <Td mono>{usd(i.amount * TAKE_RATE)}</Td>
                <Td>{i.issued}</Td>
                <Td>{i.due}</Td>
                <Td>
                  <Badge value={i.status} />
                </Td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>
    </div>
  );
}
