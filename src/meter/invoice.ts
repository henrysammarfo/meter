/**
 * INVOICE — issue A2A bills from live receipts (not invented line items).
 */

import { randomUUID } from "node:crypto";
import { MeterLiveError } from "./env";
import { appendInvoice, getLedger, mutateLedger } from "./ledger";
import type { Invoice, InvoiceLine } from "./types";

export async function issueInvoiceForAgent(agentId: string): Promise<Invoice> {
  const ledger = await getLedger();
  const agent = ledger.agents.find((a) => a.id === agentId);
  if (!agent) {
    throw new MeterLiveError("AGENT_NOT_FOUND", `Unknown agent ${agentId}`, 404);
  }

  const unbilled = ledger.receipts.filter(
    (r) => r.agentId === agentId && r.settle !== "declined" && !r.invoiceId,
  );
  if (unbilled.length === 0) {
    throw new MeterLiveError(
      "NO_UNBILLED_RECEIPTS",
      `No unbilled receipts for ${agentId}`,
      409,
    );
  }

  const byEndpoint = new Map<string, InvoiceLine>();
  for (const r of unbilled) {
    const cur = byEndpoint.get(r.endpoint) ?? {
      endpoint: r.endpoint,
      units: 0,
      unitPrice: r.amount,
      amount: 0,
    };
    cur.units += 1;
    cur.amount = Number((cur.amount + r.amount).toFixed(6));
    byEndpoint.set(r.endpoint, cur);
  }
  const lines = [...byEndpoint.values()];
  const amount = Number(lines.reduce((s, l) => s + l.amount, 0).toFixed(6));
  const takeFee = Number((amount * ledger.takeRate).toFixed(6));
  const issued = new Date();
  const due = new Date(issued.getTime() + 7 * 24 * 3600 * 1000);
  const invoice: Invoice = {
    id: `INV-${issued.toISOString().slice(0, 10).replace(/-/g, "")}-${randomUUID().slice(0, 4).toUpperCase()}`,
    counterparty: agent.owner,
    agentId,
    amount,
    calls: unbilled.length,
    issued: issued.toISOString(),
    due: due.toISOString().slice(0, 10),
    status: "open",
    lines,
    takeFee,
  };

  const receiptIds = new Set(unbilled.map((r) => r.id));
  await mutateLedger((snap) => {
    for (const r of snap.receipts) {
      if (receiptIds.has(r.id)) r.invoiceId = invoice.id;
    }
  });
  await appendInvoice(invoice);
  return invoice;
}

export async function markInvoicePaid(invoiceId: string): Promise<Invoice> {
  let updated: Invoice | undefined;
  await mutateLedger((ledger) => {
    const inv = ledger.invoices.find((i) => i.id === invoiceId);
    if (!inv) {
      throw new MeterLiveError("INVOICE_NOT_FOUND", `Unknown invoice ${invoiceId}`, 404);
    }
    inv.status = "paid";
    updated = inv;
  });
  if (!updated) throw new MeterLiveError("INVOICE_NOT_FOUND", `Unknown invoice ${invoiceId}`, 404);
  return updated;
}
