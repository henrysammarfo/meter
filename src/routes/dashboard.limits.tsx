import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, TriangleAlert } from "lucide-react";
import { Badge, Kpi, PageHead, Panel, Table, Td } from "@/components/dashboard/ui";
import { fetchLedgerOverview, type LedgerOverview, usd } from "@/lib/meter-data";

export const Route = createFileRoute("/dashboard/limits")({
  head: () => ({
    meta: [
      { title: "Limits — METER ledger" },
      {
        name: "description",
        content: "Spend caps aligned to Binance Agentic Wallet x402 default $20/day.",
      },
    ],
  }),
  component: Limits,
});

function Limits() {
  const [data, setData] = useState<LedgerOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLedgerOverview()
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!data) return <PageHead title="Limits" sub="Loading…" />;

  const rules = data.limits;
  const breached = rules.filter((r) => r.cap > 0 && r.used / r.cap >= 0.9);

  return (
    <div>
      <PageHead
        title="Limits"
        sub="When a cap trips, METER fails cleanly (429) instead of overspending. Default workspace cap mirrors Binance x402 $20/day."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Active rules" value={String(rules.length)} />
        <Kpi
          label="Near or at cap"
          value={String(breached.length)}
          tone={breached.length ? "danger" : "signal"}
          hint="≥ 90% of the window consumed"
        />
        <Kpi label="Workspace cap" value={usd(data.dailyCapUsdc)} hint="UTC day" />
      </div>

      <Panel className="mt-6" title="Policy" subtitle="Read from durable ledger">
        <Table head={["Scope", "Used", "Cap", "Window", "Action"]}>
          {rules.map((r) => (
            <tr key={r.id}>
              <Td>
                <span className="inline-flex items-center gap-2">
                  {r.used / r.cap >= 0.9 ? (
                    <TriangleAlert className="h-3.5 w-3.5 text-destructive" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  )}
                  {r.scope}
                </span>
              </Td>
              <Td>{usd(r.used)}</Td>
              <Td>{usd(r.cap)}</Td>
              <Td>{r.window}</Td>
              <Td>
                <Badge value={r.action} />
              </Td>
            </tr>
          ))}
        </Table>
      </Panel>

      <Panel className="mt-6" title="Agents" subtitle="Sandbox subaccounts — withdrawals restricted">
        <Table head={["Agent", "Owner", "Balance", "Status"]}>
          {data.agents.length === 0 && (
            <tr>
              <Td>No agents — fund via /demo or POST /api/v1/subaccounts</Td>
              <Td>—</Td>
              <Td>—</Td>
              <Td>—</Td>
            </tr>
          )}
          {data.agents.map((a) => (
            <tr key={a.id}>
              <Td>{a.label}</Td>
              <Td>{a.owner}</Td>
              <Td>{usd(a.balance ?? 0)}</Td>
              <Td>
                <Badge value={a.status} />
              </Td>
            </tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}
