import { round2 } from "@/lib/ledger/money";
import type { Line, Payer, Payment, Phase, Project, Status } from "@/lib/ledger/types";

export const STATUS_WEIGHT: Record<Status, number> = {
  planned: 0,
  quoted: 0.15,
  ordered: 0.35,
  "in-progress": 0.7,
  done: 1,
};

export const GROUPS: { name: string; phaseIds: string[] }[] = [
  { name: "Soft costs", phaseIds: ["pre", "fees", "permits"] },
  { name: "Structure", phaseIds: ["earth", "structure", "masonry"] },
  { name: "Envelope", phaseIds: ["roof", "openings", "wetproof"] },
  { name: "MEP", phaseIds: ["electrical", "plumbing"] },
  { name: "Finishes", phaseIds: ["floors", "walls", "stairs", "carpentry"] },
  { name: "Wet rooms", phaseIds: ["kitchen", "baths"] },
  { name: "Site", phaseIds: ["exterior", "systems"] },
  { name: "Fit-out", phaseIds: ["appliances", "close"] },
  { name: "Additionals", phaseIds: ["extras"] },
];

export type Figures = {
  supply: number;
  labor: number;
  budget: number;
  actual: number;
  paid: number;
  left: number;
};

export type BookTotals = Figures & {
  direct: number;
  vat: number;
  contingency: number;
  allIn: number;
  payable: number;
  work: number;
  contractor: Figures;
  owner: Figures;
};

export function lineSupply(line: Line): number {
  return round2(line.qty * line.materialRate);
}

export function lineLabor(line: Line): number {
  return round2(line.qty * line.laborRate);
}

export function lineBudget(line: Line): number {
  return round2(lineSupply(line) + lineLabor(line));
}

export function linkedPayments(lineId: string, payments: Payment[]): Payment[] {
  return payments.filter((payment) => payment.lineId === lineId && !payment.toContractor);
}

export function paidToContractor(payments: Payment[]): number {
  return round2(
    payments.filter((payment) => payment.toContractor).reduce((sum, payment) => sum + payment.amount, 0),
  );
}

export function paidOf(line: Line, payments: Payment[]): number {
  const linked = linkedPayments(line.id, payments);
  if (linked.length === 0) return round2(line.paid);
  return round2(linked.reduce((sum, payment) => sum + payment.amount, 0));
}

export function lineLeft(line: Line): number {
  return round2(lineBudget(line) - line.actual);
}

export function emptyFigures(): Figures {
  return { supply: 0, labor: 0, budget: 0, actual: 0, paid: 0, left: 0 };
}

export function sumLines(lines: Line[], payments: Payment[]): Figures {
  return lines.reduce((sum, line) => {
    const supply = lineSupply(line);
    const labor = lineLabor(line);
    const budget = round2(supply + labor);
    const paid = paidOf(line, payments);
    return {
      supply: round2(sum.supply + supply),
      labor: round2(sum.labor + labor),
      budget: round2(sum.budget + budget),
      actual: round2(sum.actual + line.actual),
      paid: round2(sum.paid + paid),
      left: round2(sum.left + (budget - line.actual)),
    };
  }, emptyFigures());
}

export function bookTotals(
  lines: Line[],
  payments: Payment[],
  project: Project,
): BookTotals {
  const base = sumLines(lines, payments);
  const contractorLines = sumLines(
    lines.filter((line) => line.payer !== "owner"),
    payments,
  );
  const owner = sumLines(
    lines.filter((line) => line.payer === "owner"),
    payments,
  );
  const typedFee = project.contractorFee;
  const contractorBudget = round2(Math.max(0, typedFee ?? 0));
  const cashPaid = paidToContractor(payments);
  const direct = round2(contractorBudget + owner.budget);
  const vat = round2(direct * (project.vatPct / 100));
  const contingency = round2((direct + vat) * (project.contingencyPct / 100));
  const allIn = round2(direct + vat + contingency);
  const payable = round2(
    lines.reduce((sum, line) => sum + Math.max(0, line.actual - paidOf(line, payments)), 0),
  );
  const work =
    base.budget > 0
      ? lines.reduce((sum, line) => sum + lineBudget(line) * STATUS_WEIGHT[line.status], 0) /
        base.budget
      : 0;
  return {
    ...base,
    direct,
    vat,
    contingency,
    allIn,
    payable,
    work,
    contractor: {
      ...contractorLines,
      budget: contractorBudget,
      paid: cashPaid,
      left: round2(contractorBudget - cashPaid),
    },
    owner,
  };
}

export function linesInPhase(lines: Line[], phaseId: string): Line[] {
  return lines
    .filter((line) => line.phaseId === phaseId)
    .slice()
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export function matchesQuery(
  line: Line,
  query: string,
  status: Status | "all",
  payer: Payer | "all" = "all",
): boolean {
  if (status !== "all" && line.status !== status) return false;
  if (payer !== "all" && line.payer !== payer) return false;
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [line.name, line.spec, line.vendor, line.notes, line.unit].some((value) =>
    value.toLowerCase().includes(needle),
  );
}

export type GroupBar = { name: string; budget: number; actual: number };

export function groupBars(lines: Line[], phases: Phase[]): GroupBar[] {
  const known = new Set(GROUPS.flatMap((group) => group.phaseIds));
  const extra = phases.filter((phase) => !known.has(phase.id)).map((phase) => phase.id);
  const groups = extra.length
    ? [...GROUPS, { name: "Added", phaseIds: extra }]
    : GROUPS;
  return groups.map((group) => {
    const rows = lines.filter((line) => group.phaseIds.includes(line.phaseId));
    const figures = sumLines(rows, []);
    return { name: group.name, budget: figures.budget, actual: figures.actual };
  });
}

export function perSqm(amount: number, area: number): number | null {
  if (!area || area <= 0) return null;
  return round2(amount / area);
}

export function share(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}
