import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Badge, Kpi, PageHead, Panel, Table, Td } from "@/components/dashboard/ui";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Settings — METER ledger" },
      {
        name: "description",
        content: "Live provider health, caps and settlement configuration for this METER workspace.",
      },
    ],
  }),
  component: SettingsPage,
});

type Health = {
  ok: boolean;
  service: string;
  track: string;
  live: Record<string, boolean>;
  dailyCapUsdc: number;
  researchPriceUsdc: number;
  doctrine: string;
};

function SettingsPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/health")
      .then(async (r) => {
        const body = (await r.json()) as Health;
        if (!r.ok) throw new Error(JSON.stringify(body));
        setHealth(body);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!health) return <PageHead title="Settings" sub="Loading provider health…" />;

  return (
    <div>
      <PageHead
        title="Settings"
        sub="Operator view of live wiring. Secrets stay in server env — never shown here."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Service" value={health.service} tone="signal" />
        <Kpi label="Daily cap" value={`$${health.dailyCapUsdc}`} hint="USDC / UTC day" />
        <Kpi label="Research price" value={`$${health.researchPriceUsdc}`} hint="per query" />
      </div>

      <Panel className="mt-6" title="Live providers" subtitle={`Doctrine: ${health.doctrine}`}>
        <Table head={["Provider", "Configured", "Notes"]}>
          {Object.entries(health.live).map(([k, v]) => (
            <tr key={k}>
              <Td>{k}</Td>
              <Td>
                <Badge value={v ? "live" : "paused"} />
              </Td>
              <Td>
                {k === "onchainX402" && !v
                  ? "Set METER_PAY_TO + METER_USDC_ASSET"
                  : k === "binanceAgentOs" && !v
                    ? "Awaiting BINANCE_AGENT_OS_API_KEY"
                    : k === "agentrouter" && v
                      ? "Key present — host may still hit WAF"
                      : "—"}
              </Td>
            </tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}
