import { create } from "zustand";
import { persist } from "zustand/middleware";
import { OWNER_LINE_NAMES, seedLines, seedPhases } from "@/lib/ledger/seed";
import {
  defaultProject,
  type Line,
  type Payer,
  type Payment,
  type Phase,
  type Project,
} from "@/lib/ledger/types";

type Data = {
  project: Project;
  phases: Phase[];
  lines: Line[];
  payments: Payment[];
};

type SavedLine = Omit<Line, "payer"> & { payer?: Payer };

function normalizeLine(line: SavedLine, retagOwner: boolean): Line {
  const payer: Payer =
    line.payer === "owner" || line.payer === "contractor"
      ? line.payer
      : retagOwner && OWNER_LINE_NAMES.has(line.name)
        ? "owner"
        : "contractor";
  return { ...line, payer };
}

export function migrateData(saved: Partial<Data> & { lines?: SavedLine[] }): Data {
  const incomingVersion = saved.project?.bookVersion ?? 1;
  if (incomingVersion < 3) {
    return {
      project: {
        ...defaultProject,
        name: saved.project?.name || defaultProject.name,
        location: saved.project?.location || defaultProject.location,
        floorArea: saved.project?.floorArea || defaultProject.floorArea,
        stories: saved.project?.stories || defaultProject.stories,
        contractorName: saved.project?.contractorName || defaultProject.contractorName,
        startDate: saved.project?.startDate ?? "",
        targetDate: saved.project?.targetDate ?? "",
        contractorFee: 0,
        contingencyPct: 0,
        vatPct: 0,
        bookVersion: 3,
      },
      phases: seedPhases(),
      lines: [],
      payments: [],
    };
  }
  const project: Project = {
    ...defaultProject,
    ...saved.project,
    contractorName: saved.project?.contractorName || defaultProject.contractorName,
    contractorFee:
      saved.project != null && typeof saved.project.contractorFee === "number"
        ? saved.project.contractorFee
        : 0,
    bookVersion: 3,
  };
  const phases = saved.phases?.length ? saved.phases.map((phase) => ({ ...phase })) : seedPhases();
  const lines = (saved.lines ?? []).map((line) => normalizeLine(line, false));
  const payments = (saved.payments ?? []).map((payment) => ({
    ...payment,
    toContractor: payment.toContractor === true,
  }));
  return { project, phases, lines, payments };
}

type Actions = {
  updateProject: (patch: Partial<Project>) => void;
  updateLine: (id: string, patch: Partial<Line>) => void;
  addLine: (line: Omit<Line, "id" | "order">) => string;
  removeLine: (id: string) => void;
  addPhase: (name: string) => string;
  renamePhase: (id: string, name: string) => void;
  addPayment: (payment: Omit<Payment, "id">) => void;
  updatePayment: (id: string, patch: Partial<Payment>) => void;
  removePayment: (id: string) => void;
  replaceBook: (data: Data) => void;
  reset: () => void;
};

export type LedgerState = Data & Actions;

function stamped(
  set: (recipe: (state: LedgerState) => Partial<LedgerState>) => void,
  recipe: (state: LedgerState) => Partial<LedgerState>,
) {
  set((state) => {
    const next = recipe(state);
    return {
      ...next,
      project: { ...state.project, ...next.project, editedAt: Date.now() },
    };
  });
}

function freshData(): Data {
  return {
    project: { ...defaultProject },
    phases: seedPhases(),
    lines: seedLines(),
    payments: [],
  };
}

export const useLedger = create<LedgerState>()(
  persist(
    (set) => ({
      ...freshData(),
      updateProject: (patch) =>
        stamped(set, (state) => ({ project: { ...state.project, ...patch } })),
      updateLine: (id, patch) =>
        stamped(set, (state) => ({
          lines: state.lines.map((line) => (line.id === id ? { ...line, ...patch } : line)),
        })),
      addLine: (line) => {
        const id = crypto.randomUUID();
        stamped(set, (state) => ({
          lines: [
            ...state.lines,
            { ...line, id, order: state.lines.length + 1, name: line.name.trim(), payer: line.payer ?? "contractor" },
          ],
        }));
        return id;
      },
      removeLine: (id) =>
        stamped(set, (state) => ({
          lines: state.lines.filter((line) => line.id !== id),
          payments: state.payments.map((payment) =>
            payment.lineId === id ? { ...payment, lineId: "" } : payment,
          ),
        })),
      addPhase: (name) => {
        const id = crypto.randomUUID();
        stamped(set, (state) => ({
          phases: [
            ...state.phases,
            { id, name: name.trim() || "New scope", blurb: "A scope you added." },
          ],
        }));
        return id;
      },
      renamePhase: (id, name) =>
        stamped(set, (state) => ({
          phases: state.phases.map((phase) => (phase.id === id ? { ...phase, name } : phase)),
        })),
      addPayment: (payment) =>
        stamped(set, (state) => ({
          payments: [{ ...payment, id: crypto.randomUUID() }, ...state.payments],
        })),
      updatePayment: (id, patch) =>
        stamped(set, (state) => ({
          payments: state.payments.map((payment) =>
            payment.id === id ? { ...payment, ...patch } : payment,
          ),
        })),
      removePayment: (id) =>
        stamped(set, (state) => ({
          payments: state.payments.filter((payment) => payment.id !== id),
        })),
      replaceBook: (data) => set(() => ({
        project: data.project,
        phases: data.phases,
        lines: data.lines,
        payments: data.payments,
      })),
      reset: () => stamped(set, () => freshData()),
    }),
    {
      name: "house-construction-expenses-v1",
      skipHydration: true,
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<Data> & { lines?: SavedLine[] };
        if (!saved.lines && !saved.project) return current;
        return { ...current, ...migrateData(saved) };
      },
      partialize: (state) => ({
        project: state.project,
        phases: state.phases,
        lines: state.lines,
        payments: state.payments,
      }),
    },
  ),
);
