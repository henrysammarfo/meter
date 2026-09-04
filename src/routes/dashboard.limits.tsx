import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, TriangleAlert } from "lucide-react";
import { Badge, Kpi, PageHead, Panel, Table, Td } from "@/components/dashboard/ui";
import { agents, limits as seedLimits, usd } from "@/lib/meter-data";

export const Route = createFileRoute("/dashboard/limits")({
  head: () => ({
    meta: [
      { title: "Limits — METER ledger" },
      {
        name: "description",
        content: "Spend caps, burst rates and failure actions that keep an autonomous agent from draining a wallet.",
      },
    ],
  }),
  component: Limits,
});

function Limits() {
  const [rules, setRules] = useState(seedLimits);
  const breached = rules.filter((r) => r.used / r.cap >= 0.9);

  const setCap = (id: string, cap: number) =>
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, cap } : r)));

  return (
    <div>
      <PageHead
        title="Limits"
        sub="A limit is a promise to the wallet owner. When a cap trips, METER fails the call cleanly with a 429 instead of overspending."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Active rules" value={String(rules.length)} />
        <Kpi
          label="Near or at cap"
          value={String(breached.length)}
          tone={breached.length ? "danger" : "signal"}
          hint="≥ 90% of the window consumed"
        />
        <Kpi label="Throttled agents" value={String(agents.filter((a) => a.status !== "active").length)} />
      </div>

      <div className="mt-6 grid gap-6">
        <Panel title="Policy" subtitle="Drag a cap to simulate the change before you commit it">
          <div className="space-y-6">
            {rules.map((r) => {
              const ratio = Math.min(1, r.used / r.cap);
              const hot = ratio >= 0.9;
              return (
                <div key={r.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {hot ? (
                        <TriangleAlert className="size-4 text-destructive" />
                      ) : (
                        <ShieldCheck className="size-4 text-primary" />
                      )}
                      <p className="text-sm">{r.scope}</p>
                      <Badge value={r.action} />
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {r.window === "per minute" ? `${r.used} / ${r.cap} rpm` : `${usd(r.used)} / ${usd(r.cap)}`} ·{" "}
                      {r.window}
                    </p>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${hot ? "bg-destructive" : "bg-primary"}`}
                      style={{ width: `${ratio * 100}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min={r.window === "per minute" ? 50 : 0.05}
                    max={r.window === "per minute" ? 1000 : Math.max(50, r.cap * 3)}
                    step={r.window === "per minute" ? 10 : 0.05}
                    value={r.cap}
                    onChange={(e) => setCap(r.id, Number(e.target.value))}
                    className="mt-3 w-full accent-[var(--color-primary)]"
                    aria-label={`${r.scope} cap`}
                  />
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Agent exposure" subtitle="What each subaccount could still spend today">
          <Table head={["Agent", "Owner", "Funded", "Spent 24h", "Headroom", "Status"]}>
            {agents.map((a) => (
              <tr key={a.id}>
                <Td mono>{a.id}</Td>
                <Td>{a.owner}</Td>
                <Td mono>{usd(a.funded)}</Td>
                <Td mono>{usd(a.spent24h)}</Td>
                <Td mono>{usd(Math.max(0, a.funded - a.spent24h))}</Td>
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
