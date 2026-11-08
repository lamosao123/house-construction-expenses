import { bookTotals, lineBudget, paidOf } from "@/lib/ledger/calc";
import { pesoNumber, prettyDate } from "@/lib/ledger/money";
import type { BookPayload } from "@/lib/ledger/book";

export async function downloadExcel(state: BookPayload) {
  const XLSX = await import("xlsx");
  const { project, phases, lines, payments } = state;
  const totals = bookTotals(lines, payments, project);
  const extras = lines.filter((line) => line.payer === "owner");
  const extrasLeft = totals.owner.budget - totals.owner.paid;
  const overallPaid = totals.contractor.paid + totals.owner.paid;
  const overallLeft = totals.allIn - overallPaid;

  const summary = [
    ["House Construction Expenses"],
    ["Project", project.name],
    ["Location", project.location],
    ["Contractor", project.contractorName],
    ["Contract", pesoNumber(totals.contractor.budget)],
    ["Paid to contractor", pesoNumber(totals.contractor.paid)],
    ["Remaining on contractor", pesoNumber(totals.contractor.left)],
    ["Extras billed", pesoNumber(totals.owner.budget)],
    ["Extras paid", pesoNumber(totals.owner.paid)],
    ["Extras remaining", pesoNumber(extrasLeft)],
    ["VAT", pesoNumber(totals.vat)],
    ["Contingency", pesoNumber(totals.contingency)],
    ["Project total", pesoNumber(totals.allIn)],
    ["Paid out", pesoNumber(overallPaid)],
    ["Overall remaining", pesoNumber(overallLeft)],
  ];

  const extraRows: (string | number)[][] = [["Additional cost", "Billed", "Paid", "Left", "Date"]];
  for (const line of extras) {
    const billed = lineBudget(line);
    const paid = paidOf(line, payments);
    extraRows.push([
      line.name,
      pesoNumber(billed),
      pesoNumber(paid),
      pesoNumber(billed - paid),
      prettyDate(line.date) || line.date,
    ]);
  }

  const payRows: (string | number)[][] = [["Date", "Who", "Amount", "Applies to"]];
  for (const payment of payments) {
    const line = lines.find((item) => item.id === payment.lineId);
    const phase = phases.find((item) => item.id === payment.phaseId);
    payRows.push([
      prettyDate(payment.date) || payment.date,
      payment.payee,
      pesoNumber(payment.amount),
      payment.toContractor ? "Contractor" : line?.name || phase?.name || "Additional",
    ]);
  }

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(summary), "Summary");
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(extraRows), "Extras");
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(payRows), "Payments");
  XLSX.writeFile(book, "house-construction-expenses.xlsx");
}
