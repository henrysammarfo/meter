import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Badge, Kpi, PageHead, Panel, Table, Td } from "@/components/dashboard/ui";
import {
  fetchHealth,
  fundSubaccount,
  probeLabel,
  type MeterHealth,
  type ProbeStatus,
  type SettleRailStatus,
} from "@/lib/meter-api";
import {
  addAgentToWorkspace,
  createWorkspace,
  getActiveWorkspace,
  getAgentToken,
  getOperatorKey,
  listWorkspaces,
  setActiveWorkspace,
  setAgentToken,
  setOperatorKey,
} from "@/lib/meter-workspace";
import { useWorkspaceRevision } from "@/components/site/WaitlistForm";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Settings — METER ledger" },
      {
        name: "description",
        content: "Workspace, credentials, live provider health and settlement rails.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const rev = useWorkspaceRevision();
  const workspace = getActiveWorkspace();
  const workspaces = listWorkspaces();

  const [health, setHealth] = useState<MeterHealth | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deepBusy, setDeepBusy] = useState(false);

  const [opKey, setOpKey] = useState("");
  const [agentId, setAgentId] = useState("");
  const [agentTok, setAgentTok] = useState("");
  const [fundId, setFundId] = useState("");
  const [fundAmount, setFundAmount] = useState("5");
  const [fundLabel, setFundLabel] = useState("");
  const [fundMsg, setFundMsg] = useState<string | null>(null);
  const [newWsName, setNewWsName] = useState("");
  const [vaultMsg, setVaultMsg] = useState<string | null>(null);

  useEffect(() => {
    setOpKey(getOperatorKey());
  }, [rev]);

  useEffect(() => {
    let cancelled = false;
    fetchHealth(false)
      .then(({ data }) => {
        if (!cancelled) setHealth(data);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [rev]);

  async function runDeepProbe() {
    setDeepBusy(true);
    setError(null);
    try {
      const { data } = await fetchHealth(true);
      setHealth(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeepBusy(false);
    }
  }

  async function onFund(e: FormEvent) {
    e.preventDefault();
    setFundMsg(null);
    try {
      const id = fundId.trim();
      if (!id) throw new Error("Agent id required");
      const amount = Number(fundAmount);
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Amount must be > 0");
      const label = fundLabel.trim();
      const { data } = await fundSubaccount(
        label ? { id, amount, label } : { id, amount },
      );
      if (data.agentToken) setAgentToken(data.agent.id, data.agentToken);
      addAgentToWorkspace(workspace.id === "ws_all" ? "ws_public_demo" : workspace.id, data.agent.id);
      setFundMsg(
        `Funded ${data.agent.id} · balance ${data.agent.balance} · token saved in vault${data.tokenRotated ? " (rotated)" : ""}`,
      );
      setFundId("");
    } catch (err) {
      setFundMsg(err instanceof Error ? err.message : String(err));
    }
  }

  if (error && !health) return <p className="text-sm text-destructive">{error}</p>;
  if (!health) return <PageHead title="Settings" sub="Loading provider health…" />;

  const probeRows: Array<{ key: string; probe: ProbeStatus | { configured: boolean }; note: string }> = [
    {
      key: "tavily",
      probe: health.live.tavily,
      note: health.live.tavily.error ?? "Research search",
    },
    {
      key: "tinyfish",
      probe: health.live.tinyfish,
      note: health.live.tinyfish.error ?? "Secondary research",
    },
    {
      key: "llm",
      probe: health.live.llm,
      note:
        health.live.llm.error ??
        (health.live.llm.provider ? `provider=${health.live.llm.provider}` : "optional"),
    },
    {
      key: "onchainX402",
      probe: health.live.onchainX402,
      note: health.live.onchainX402.configured
        ? "METER_PAY_TO + METER_USDC_ASSET set"
        : "Set METER_PAY_TO + METER_USDC_ASSET",
    },
    {
      key: "binanceAgentOs",
      probe: health.live.binanceAgentOs,
      note: health.live.binanceAgentOs.configured
        ? "Partner credentials present"
        : "Deferred — no merchant form",
    },
    {
      key: "operatorAuth",
      probe: health.live.operatorAuth,
      note: health.live.operatorAuth.required
        ? "Required in production"
        : health.live.operatorAuth.configured
          ? "Key configured on server"
          : "Optional in this env",
    },
    {
      key: "openFacilitator",
      probe: health.live.openFacilitator,
      note: health.live.openFacilitator.url ?? "METER_FACILITATOR_URL",
    },
  ];

  const rails: SettleRailStatus[] = health.live.settleRails ?? [];

  return (
    <div>
      <PageHead
        title="Settings"
        sub="Workspace tenant, credential vault, and honest provider health. Secrets never leave this browser except as request headers."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Service" value={health.service} tone="signal" />
        <Kpi label="Daily cap" value={`$${health.dailyCapUsdc}`} hint="USDC / UTC day" />
        <Kpi label="Research price" value={`$${health.researchPriceUsdc}`} hint="per query" />
      </div>

      <Panel className="mt-6" title="Workspace" subtitle="Multi-tenant filter over the shared live ledger">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1 text-xs">
            Active workspace
            <select
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={workspace.id}
              onChange={(e) => setActiveWorkspace(e.target.value)}
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                  {w.agentIds.length ? ` (${w.agentIds.length} agents)` : ""}
                </option>
              ))}
            </select>
          </label>
          <form
            className="flex flex-1 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newWsName.trim()) return;
              createWorkspace(newWsName);
              setNewWsName("");
            }}
          >
            <input
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              placeholder="New workspace name"
              className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-full bg-secondary px-4 py-2 text-sm hover:bg-secondary/80"
            >
              Create
            </button>
          </form>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Agents in this workspace:{" "}
          {workspace.id === "ws_all"
            ? "all (no filter)"
            : workspace.agentIds.length
              ? workspace.agentIds.join(", ")
              : "none yet — fund below"}
        </p>
      </Panel>

      <Panel
        className="mt-6"
        title="Credential vault"
        subtitle="Stored in localStorage only. Used for X-Meter-Operator-Key and X-Meter-Agent-Token."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-xs">
            Operator key
            <input
              type="password"
              autoComplete="off"
              value={opKey}
              onChange={(e) => setOpKey(e.target.value)}
              placeholder="METER_OPERATOR_KEY"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
            />
          </label>
          <div className="flex items-end gap-2">
            <button
              type="button"
              className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
              onClick={() => {
                setOperatorKey(opKey);
                setVaultMsg("Operator key saved");
              }}
            >
              Save operator key
            </button>
            <button
              type="button"
              className="rounded-full border border-border px-4 py-2 text-sm"
              onClick={() => {
                setOpKey("");
                setOperatorKey("");
                setVaultMsg("Operator key cleared");
              }}
            >
              Clear
            </button>
          </div>
          <label className="block text-xs">
            Agent id
            <input
              value={agentId}
              onChange={(e) => {
                setAgentId(e.target.value);
                setAgentTok(getAgentToken(e.target.value.trim()));
              }}
              placeholder="agent_…"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
            />
          </label>
          <label className="block text-xs">
            Agent token
            <input
              type="password"
              autoComplete="off"
              value={agentTok}
              onChange={(e) => setAgentTok(e.target.value)}
              placeholder="shown once at fund time"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full bg-secondary px-4 py-2 text-sm"
            onClick={() => {
              if (!agentId.trim()) {
                setVaultMsg("Enter an agent id");
                return;
              }
              setAgentToken(agentId.trim(), agentTok);
              addAgentToWorkspace(
                workspace.id === "ws_all" ? "ws_public_demo" : workspace.id,
                agentId.trim(),
              );
              setVaultMsg(`Token saved for ${agentId.trim()}`);
            }}
          >
            Save agent token
          </button>
          {vaultMsg && <p className="self-center text-xs text-muted-foreground">{vaultMsg}</p>}
        </div>
      </Panel>

      <Panel className="mt-6" title="Fund agent into workspace" subtitle="POST /api/v1/subaccounts (operator key)">
        <form className="grid gap-3 md:grid-cols-4" onSubmit={(e) => void onFund(e)}>
          <input
            value={fundId}
            onChange={(e) => setFundId(e.target.value)}
            placeholder="agent id"
            className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
          />
          <input
            value={fundAmount}
            onChange={(e) => setFundAmount(e.target.value)}
            placeholder="amount USDC"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={fundLabel}
            onChange={(e) => setFundLabel(e.target.value)}
            placeholder="label (optional)"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">
            Fund
          </button>
        </form>
        {fundMsg && <p className="mt-3 text-xs text-muted-foreground">{fundMsg}</p>}
      </Panel>

      <Panel
        className="mt-6"
        title="Live providers"
        subtitle={`Doctrine: ${health.doctrine}${error ? ` · ${error}` : ""}`}
      >
        <div className="mb-3">
          <button
            type="button"
            disabled={deepBusy}
            onClick={() => void runDeepProbe()}
            className="rounded-full border border-border px-4 py-1.5 text-xs disabled:opacity-50"
          >
            {deepBusy ? "Probing…" : "Run deep probe"}
          </button>
        </div>
        <Table head={["Provider", "Status", "Notes"]}>
          {probeRows.map(({ key, probe, note }) => (
            <tr key={key}>
              <Td>{key}</Td>
              <Td>
                <Badge value={probeLabel(probe)} />
              </Td>
              <Td>
                <span className="text-xs text-muted-foreground">{note}</span>
              </Td>
            </tr>
          ))}
        </Table>
      </Panel>

      <Panel className="mt-6" title="Settle rails" subtitle="Honest status — prepaid is primary">
        <Table head={["Rail", "Live", "Note"]}>
          {rails.map((r) => (
            <tr key={r.id}>
              <Td>{r.id}</Td>
              <Td>
                <Badge value={r.live ? "live" : "off"} />
              </Td>
              <Td>
                <span className="text-xs text-muted-foreground">{r.note}</span>
              </Td>
            </tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}
