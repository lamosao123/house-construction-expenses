import { bookTotals, lineBudget, lineLabor, lineSupply, paidOf } from "@/lib/ledger/calc";
import { pesoNumber } from "@/lib/ledger/money";
import type { LedgerState } from "@/lib/ledger/store";
import { methodLabel, payerLabel, statusLabel } from "@/lib/ledger/types";

function cell(value: string | number): string {
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function sheet(rows: (string | number)[][]): string {
  return rows.map((row) => row.map(cell).join(",")).join("\r\n");
}

export function ledgerCsv(state: Pick<LedgerState, "project" | "phases" | "lines" | "payments">): string {
  const { project, phases, lines, payments } = state;
  const totals = bookTotals(lines, payments, project);
  const summary: (string | number)[][] = [
    ["House Construction Expenses"],
    ["Project", project.name],
    ["Location", project.location],
    ["Floor area sqm", project.floorArea],
    ["Storeys", project.stories],
    ["Start", project.startDate],
    ["Target finish", project.targetDate],
    ["Contingency percent", project.contingencyPct],
    ["VAT percent", project.vatPct],
    ["Notes", project.notes],
    ["Contractor", project.contractorName],
    ["Contractor fee", pesoNumber(totals.contractor.budget)],
    ["Paid to contractor", pesoNumber(totals.contractor.paid)],
    ["Remaining on contractor", pesoNumber(totals.contractor.left)],
    ["Additionals", pesoNumber(totals.owner.budget)],
    ["Paid on additionals", pesoNumber(totals.owner.paid)],
    [],
    ["Direct budget", pesoNumber(totals.direct)],
    ["VAT", pesoNumber(totals.vat)],
    ["Contingency", pesoNumber(totals.contingency)],
    ["All-in budget", pesoNumber(totals.allIn)],
    ["Billed", pesoNumber(totals.actual)],
    ["Paid on lines", pesoNumber(totals.paid)],
    ["Left in plan", pesoNumber(totals.allIn - totals.actual)],
    [],
    [
      "Phase",
      "Item",
      "Spec",
      "Unit",
      "Qty",
      "Supply rate",
      "Labor rate",
      "Supply",
      "Labor",
      "Budget",
      "Billed",
      "Paid",
      "Left",
      "Vendor",
      "Who pays",
      "Status",
      "Date",
      "Notes",
    ],
  ];

  for (const phase of phases) {
    const rows = lines
      .filter((line) => line.phaseId === phase.id)
      .slice()
      .sort((a, b) => a.order - b.order);
    for (const line of rows) {
      const budget = lineBudget(line);
      const paid = paidOf(line, payments);
      summary.push([
        phase.name,
        line.name,
        line.spec,
        line.unit,
        line.qty,
        line.materialRate,
        line.laborRate,
        pesoNumber(lineSupply(line)),
        pesoNumber(lineLabor(line)),
        pesoNumber(budget),
        pesoNumber(line.actual),
        pesoNumber(paid),
        pesoNumber(budget - line.actual),
        line.vendor,
        payerLabel(line.payer),
        statusLabel(line.status),
        line.date,
        line.notes,
      ]);
    }
  }

  summary.push([]);
  summary.push(["Cash book"]);
  summary.push(["Date", "Payee", "Scope", "Line", "Amount", "Method", "Reference", "Note"]);
  for (const payment of payments) {
    const phase = phases.find((item) => item.id === payment.phaseId);
    const line = lines.find((item) => item.id === payment.lineId);
    summary.push([
      payment.date,
      payment.payee,
      phase?.name ?? "",
      line?.name ?? "",
      pesoNumber(payment.amount),
      methodLabel(payment.method),
      payment.reference,
      payment.note,
    ]);
  }

  return `\uFEFF${sheet(summary)}`;
}

export function downloadLedger(state: Pick<LedgerState, "project" | "phases" | "lines" | "payments">) {
  const blob = new Blob([ledgerCsv(state)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "house-construction-expenses.csv";
  link.click();
  URL.revokeObjectURL(url);
}
