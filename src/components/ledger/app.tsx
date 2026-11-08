import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { BudgetPage } from "@/components/ledger/budget";
import { CashBook } from "@/components/ledger/cash-book";
import { CostBook } from "@/components/ledger/cost-book";
import { LineDialog } from "@/components/ledger/line-dialog";
import { Overview } from "@/components/ledger/overview";
import { bookTotals } from "@/lib/ledger/calc";
import { downloadLedger } from "@/lib/ledger/csv";
import { pesoCompact } from "@/lib/ledger/money";
import { useLedger } from "@/lib/ledger/store";
import type { Payer, Status } from "@/lib/ledger/types";

type View = "overview" | "budget" | "book" | "cash";

type DialogState =
  | null
  | { mode: "create"; phaseId: string }
  | { mode: "edit"; lineId: string; phaseId: string };

export function LedgerApp() {
  const project = useLedger((state) => state.project);
  const phases = useLedger((state) => state.phases);
  const lines = useLedger((state) => state.lines);
  const payments = useLedger((state) => state.payments);
  const totals = bookTotals(lines, payments, project);

  const [view, setView] = useState<View>("overview");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [payerFilter, setPayerFilter] = useState<Payer | "all">("all");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [exported, setExported] = useState(false);

  useEffect(() => {
    void useLedger.persist.rehydrate();
  }, []);

  const fee = totals.contractor.budget;
  const paid = totals.contractor.paid;
  const remaining = fee - paid;
  const meta = [
    project.location || "Location not set",
    `${project.stories}-storey`,
    project.floorArea > 0 ? `${project.floorArea} sqm` : "Area not set",
  ].join(" · ");

  function exportCsv() {
    downloadLedger(useLedger.getState());
    setExported(true);
    window.setTimeout(() => setExported(false), 2000);
  }

  return (
    <div className="flex h-dvh flex-col bg-bg text-ink">
      <header className="shrink-0 bg-ink px-4 py-4 text-paper">
        <div className="mx-auto flex w-full max-w-5xl items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-medium tracking-widest text-brass-bright uppercase">
              <Mark />
              House cost book
            </p>
            <h1 className="mt-1 line-clamp-2 font-display text-3xl font-medium">{project.name}</h1>
            <p className="mt-1 text-sm text-on-ink">{meta}</p>
          </div>
          <button
            type="button"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md border border-ink-line px-3 text-sm text-paper"
            onClick={exportCsv}
          >
            <Download className="size-4" aria-hidden="true" />
            {exported ? "Saved" : "CSV"}
          </button>
        </div>
      </header>

      <div className="grid shrink-0 grid-cols-2 gap-px border-b border-line bg-line sm:grid-cols-4">
        <Strip label={project.contractorName || "Contractor"} value={pesoCompact(fee)} />
        <Strip label="Paid" value={pesoCompact(paid)} />
        <Strip
          label={remaining < 0 ? "Over" : "Remaining"}
          value={pesoCompact(Math.abs(remaining))}
          clay={remaining < 0}
        />
        <Strip label="Additionals" value={pesoCompact(totals.owner.budget)} />
      </div>

      <div className="shrink-0 border-b border-line bg-paper" role="tablist" aria-label="Cost book sections">
        <div className="mx-auto flex w-full max-w-5xl">
          {(
            [
              ["overview", "Overview"],
              ["budget", "Budget"],
              ["book", "Additionals"],
              ["cash", "Payments"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              className={`h-11 flex-1 border-b-2 text-sm font-medium ${
                view === id ? "border-brass text-ink" : "border-transparent text-muted"
              }`}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="min-h-0 flex-1">
        {view === "overview" ? (
          <div className="h-full overflow-auto">
            <Overview
              onOpenPhase={(phaseId) => {
                setPhaseFilter(phaseId);
                setPayerFilter("all");
                setView("book");
              }}
              onOpenAdditionals={() => {
                setPhaseFilter("all");
                setPayerFilter("owner");
                setView("book");
              }}
            />
          </div>
        ) : null}
        {view === "budget" ? (
          <div className="h-full overflow-auto">
            <BudgetPage />
          </div>
        ) : null}
        {view === "book" ? (
          <CostBook
            phaseFilter={phaseFilter}
            setPhaseFilter={setPhaseFilter}
            query={query}
            setQuery={setQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            payerFilter={payerFilter}
            setPayerFilter={setPayerFilter}
            onEdit={(lineId) => {
              const line = lines.find((item) => item.id === lineId);
              setDialog({
                mode: "edit",
                lineId,
                phaseId: line?.phaseId ?? phases[0]?.id ?? "",
              });
            }}
            onCreate={(phaseId) => {
              if (!phaseId) return;
              setDialog({ mode: "create", phaseId });
            }}
          />
        ) : null}
        {view === "cash" ? (
          <div className="h-full overflow-auto">
            <CashBook />
          </div>
        ) : null}
      </main>

      {dialog ? (
        <LineDialog
          mode={dialog.mode}
          lineId={dialog.mode === "edit" ? dialog.lineId : undefined}
          phaseId={dialog.phaseId}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </div>
  );
}

function Strip({ label, value, clay = false }: { label: string; value: string; clay?: boolean }) {
  return (
    <div className="bg-paper px-3 py-2">
      <div className="text-xs tracking-wide text-muted uppercase">{label}</div>
      <div className={`text-sm font-medium tabular-nums ${clay ? "text-clay" : "text-ink"}`}>
        {value}
      </div>
    </div>
  );
}

function Mark() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M4 15 16 5l12 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M8 14.5V27h16V14.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );
}
