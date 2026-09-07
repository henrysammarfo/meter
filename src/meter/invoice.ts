/**
 * INVOICE — issue A2A bills from live receipts (not invented line items).
 */

import { randomUUID } from "node:crypto";
import { MeterLiveError } from "./env";
import { getLedger, mutateLedger } from "./ledger";
import type { Invoice, InvoiceLine } from "./types";

export async function issueInvoiceForAgent(agentId: string): Promise<Invoice> {
  let created: Invoice | undefined;
  await mutateLedger((ledger) => {
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
      id: `INV-${issued.toISOString().slice(0, 10).replace(/-/g, "")}-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`,
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

    for (const r of ledger.receipts) {
      if (unbilled.some((u) => u.id === r.id)) r.invoiceId = invoice.id;
    }
    ledger.invoices.unshift(invoice);
    created = invoice;
  });
  if (!created) throw new MeterLiveError("INVOICE_CREATE_FAILED", "Failed to issue invoice", 500);
  return created;
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
