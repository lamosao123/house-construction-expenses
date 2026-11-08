export const STATUSES = [
  { id: "planned", label: "Planned" },
  { id: "quoted", label: "Quoted" },
  { id: "ordered", label: "Ordered" },
  { id: "in-progress", label: "In progress" },
  { id: "done", label: "Done" },
] as const;

export type Status = (typeof STATUSES)[number]["id"];

export const METHODS = [
  { id: "cash", label: "Cash" },
  { id: "bank", label: "Bank transfer" },
  { id: "check", label: "Check" },
  { id: "gcash", label: "GCash" },
  { id: "maya", label: "Maya" },
] as const;

export type PayMethod = (typeof METHODS)[number]["id"];

export const PAYERS = [
  { id: "contractor", label: "Contractor" },
  { id: "owner", label: "You pay" },
] as const;

export type Payer = (typeof PAYERS)[number]["id"];

export function payerLabel(payer: Payer): string {
  return PAYERS.find((item) => item.id === payer)?.label ?? payer;
}

export const UNITS = [
  "lot",
  "sqm",
  "lm",
  "cu.m",
  "kg",
  "set",
  "pc",
  "month",
  "trip",
  "day",
] as const;

export type Phase = {
  id: string;
  name: string;
  blurb: string;
};

export type Line = {
  id: string;
  phaseId: string;
  name: string;
  spec: string;
  unit: string;
  qty: number;
  materialRate: number;
  laborRate: number;
  actual: number;
  paid: number;
  vendor: string;
  status: Status;
  date: string;
  notes: string;
  order: number;
  payer: Payer;
};

export type Payment = {
  id: string;
  date: string;
  payee: string;
  phaseId: string;
  lineId: string;
  amount: number;
  method: PayMethod;
  reference: string;
  note: string;
  toContractor: boolean;
};

export type Project = {
  name: string;
  location: string;
  floorArea: number;
  stories: number;
  startDate: string;
  targetDate: string;
  contingencyPct: number;
  vatPct: number;
  notes: string;
  contractorName: string;
  contractorFee: number | null;
  bookVersion: number;
  editedAt?: number;
};

export const defaultProject: Project = {
  name: "House Construction Expenses",
  location: "Cebu",
  floorArea: 150,
  stories: 2,
  startDate: "",
  targetDate: "",
  contingencyPct: 10,
  vatPct: 0,
  contractorName: "Contractor",
  contractorFee: 0,
  bookVersion: 3,
  editedAt: 0,
  notes:
    "Type the contractor’s total, then record each payment. Additionals are costs you pay yourself and are not part of that contract.",
};

export function statusLabel(status: Status): string {
  return STATUSES.find((item) => item.id === status)?.label ?? status;
}

export function methodLabel(method: PayMethod): string {
  return METHODS.find((item) => item.id === method)?.label ?? method;
}
