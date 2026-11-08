import { CellNum, controlClass } from "@/components/ledger/fields";
import {
  lineBudget,
  lineLeft,
  linesInPhase,
  matchesQuery,
  paidOf,
  sumLines,
} from "@/lib/ledger/calc";
import { peso, pesoNumber } from "@/lib/ledger/money";
import { useLedger } from "@/lib/ledger/store";
import { STATUSES, payerLabel, statusLabel, type Line, type Payer, type Status } from "@/lib/ledger/types";

export function CostBook({
  phaseFilter,
  setPhaseFilter,
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  payerFilter,
  setPayerFilter,
  onEdit,
  onCreate,
}: {
  phaseFilter: string;
  setPhaseFilter: (id: string) => void;
  query: string;
  setQuery: (value: string) => void;
  statusFilter: Status | "all";
  setStatusFilter: (status: Status | "all") => void;
  payerFilter: Payer | "all";
  setPayerFilter: (payer: Payer | "all") => void;
  onEdit: (lineId: string) => void;
  onCreate: (phaseId: string) => void;
}) {
  const phases = useLedger((state) => state.phases);
  const lines = useLedger((state) => state.lines);
  const payments = useLedger((state) => state.payments);
  const updateLine = useLedger((state) => state.updateLine);
  const renamePhase = useLedger((state) => state.renamePhase);

  const visible = phases.filter((phase) => {
    if (phaseFilter !== "all" && phase.id !== phaseFilter) return false;
    const rows = linesInPhase(lines, phase.id).filter((line) =>
      matchesQuery(line, query, statusFilter, payerFilter),
    );
    if (rows.length > 0) return true;
    return phaseFilter === phase.id && query.trim() === "" && statusFilter === "all" && payerFilter === "all";
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-col gap-2 border-b border-line bg-bg px-4 py-3 sm:flex-row">
        <input
          className={`${controlClass} sm:min-w-0 sm:flex-1`}
          placeholder="Search items, vendors, notes"
          aria-label="Search the cost book"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className={`${controlClass} sm:min-w-0 sm:flex-1`}
          aria-label="Scope"
          value={phaseFilter}
          onChange={(event) => setPhaseFilter(event.target.value)}
        >
          <option value="all">All scopes</option>
          {phases.map((phase) => (
            <option key={phase.id} value={phase.id}>
              {phase.name}
            </option>
          ))}
        </select>
        <select
          className={`${controlClass} sm:min-w-0 sm:flex-1`}
          aria-label="Status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as Status | "all")}
        >
          <option value="all">Any status</option>
          {STATUSES.map((status) => (
            <option key={status.id} value={status.id}>
              {status.label}
            </option>
          ))}
        </select>
        <select
          className={`${controlClass} sm:min-w-0 sm:flex-1`}
          aria-label="Who pays"
          value={payerFilter}
          onChange={(event) => setPayerFilter(event.target.value as Payer | "all")}
        >
          <option value="all">Contractor and you</option>
          <option value="contractor">Contractor only</option>
          <option value="owner">You pay only</option>
        </select>
        <button
          type="button"
          className="h-11 shrink-0 rounded-md bg-ink px-4 text-sm font-medium text-paper"
          onClick={() => onCreate(phaseFilter === "all" ? phases[0]?.id ?? "" : phaseFilter)}
        >
          Add line
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto pb-16">
        {visible.length === 0 ? (
          <p className="px-4 py-10 text-sm text-muted">
            Nothing matches. Clear the search, or add a line.
          </p>
        ) : (
          visible.map((phase) => {
            const rows = linesInPhase(lines, phase.id).filter((line) =>
              matchesQuery(line, query, statusFilter, payerFilter),
            );
            const figures = sumLines(rows, payments);
            return (
              <section key={phase.id}>
                <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-brass-soft px-4 py-3">
                  <input
                    aria-label={`Scope name ${phase.name}`}
                    className="min-w-0 flex-1 bg-transparent font-display text-xl text-ink outline-none"
                    value={phase.name}
                    onChange={(event) => renamePhase(phase.id, event.target.value)}
                    onBlur={(event) =>
                      renamePhase(phase.id, event.target.value.trim() || "Untitled scope")
                    }
                  />
                  <div className="hidden text-right text-xs text-muted sm:block">
                    <div className="font-medium text-ink tabular-nums">{peso(figures.budget)}</div>
                    <div>{peso(figures.actual)} billed</div>
                  </div>
                  <button
                    type="button"
                    className="h-11 shrink-0 rounded-md border border-ink-line px-3 text-sm"
                    onClick={() => onCreate(phase.id)}
                  >
                    Add
                  </button>
                </div>
                <p className="px-4 py-2 text-xs text-muted sm:hidden">
                  {peso(figures.budget)} budget · {peso(figures.actual)} billed
                </p>

                <div className="md:hidden">
                  {rows.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-muted">No lines in this scope yet.</p>
                  ) : (
                    rows.map((line) => (
                      <MobileRow
                        key={line.id}
                        line={line}
                        paid={paidOf(line, payments)}
                        locked={payments.some((payment) => payment.lineId === line.id)}
                        onEdit={() => onEdit(line.id)}
                        onActual={(actual) => updateLine(line.id, { actual })}
                        onPaid={(paid) => updateLine(line.id, { paid })}
                        onPayer={(payer) => updateLine(line.id, { payer })}
                      />
                    ))
                  )}
                </div>

                <div className="hidden md:block">
                  <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
                    <thead className="bg-paper text-left text-xs tracking-wide text-muted uppercase">
                      <tr>
                        <th className="sticky left-0 z-10 border-b border-r border-line bg-paper px-3 py-2 font-medium">
                          Item
                        </th>
                        <th className="border-b border-line px-2 py-2 font-medium">Unit</th>
                        <th className="border-b border-line px-2 py-2 text-right font-medium">Qty</th>
                        <th className="border-b border-line px-2 py-2 text-right font-medium">Supply</th>
                        <th className="border-b border-line px-2 py-2 text-right font-medium">Labor</th>
                        <th className="border-b border-line px-2 py-2 text-right font-medium">Budget</th>
                        <th className="border-b border-line px-2 py-2 text-right font-medium">Billed</th>
                        <th className="border-b border-line px-2 py-2 text-right font-medium">Paid</th>
                        <th className="border-b border-line px-2 py-2 text-right font-medium">Left</th>
                        <th className="border-b border-line px-2 py-2 font-medium">Vendor</th>
                        <th className="border-b border-line px-2 py-2 font-medium">Status</th>
                        <th className="border-b border-line px-2 py-2 font-medium">Pays</th>
                        <th className="border-b border-line px-2 py-2 font-medium">
                          <span className="sr-only">Edit</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td className="px-3 py-6 text-muted" colSpan={13}>
                            No lines in this scope yet.
                          </td>
                        </tr>
                      ) : (
                        rows.map((line) => {
                          const budget = lineBudget(line);
                          const paid = paidOf(line, payments);
                          const left = lineLeft(line);
                          const locked = payments.some((payment) => payment.lineId === line.id);
                          const hot = line.actual > budget && (budget > 0 || line.actual > 0);
                          return (
                            <tr key={line.id} className={hot ? "bg-clay-soft" : "bg-paper"}>
                              <th
                                className={`sticky left-0 z-10 border-r border-b border-line px-3 py-1 text-left font-medium ${
                                  hot ? "bg-clay-soft" : "bg-paper"
                                }`}
                              >
                                <button
                                  type="button"
                                  className="block max-w-64 min-w-40 truncate text-left"
                                  onClick={() => onEdit(line.id)}
                                >
                                  {line.name}
                                </button>
                                <span className="block max-w-64 truncate text-xs font-normal text-muted">
                                  {line.spec}
                                </span>
                              </th>
                              <td className="border-b border-line px-2">
                                <input
                                  aria-label={`Unit for ${line.name}`}
                                  className="h-10 w-16 bg-transparent text-sm outline-none"
                                  value={line.unit}
                                  onChange={(event) => updateLine(line.id, { unit: event.target.value })}
                                />
                              </td>
                              <td className="border-b border-line">
                                <CellNum
                                  bare
                                  label={`Quantity for ${line.name}`}
                                  value={line.qty}
                                  onChange={(qty) => updateLine(line.id, { qty })}
                                />
                              </td>
                              <td className="border-b border-line">
                                <CellNum
                                  bare
                                  label={`Supply rate for ${line.name}`}
                                  value={line.materialRate}
                                  onChange={(materialRate) => updateLine(line.id, { materialRate })}
                                />
                              </td>
                              <td className="border-b border-line">
                                <CellNum
                                  bare
                                  label={`Labor rate for ${line.name}`}
                                  value={line.laborRate}
                                  onChange={(laborRate) => updateLine(line.id, { laborRate })}
                                />
                              </td>
                              <td className="border-b border-line px-2 text-right tabular-nums">
                                {pesoNumber(budget)}
                              </td>
                              <td className="border-b border-line">
                                <CellNum
                                  bare
                                  label={`Billed for ${line.name}`}
                                  value={line.actual}
                                  onChange={(actual) => updateLine(line.id, { actual })}
                                />
                              </td>
                              <td className="border-b border-line">
                                <CellNum
                                  bare
                                  label={`Paid for ${line.name}`}
                                  value={paid}
                                  readOnly={locked}
                                  onChange={(next) => updateLine(line.id, { paid: next })}
                                />
                              </td>
                              <td
                                className={`border-b border-line px-2 text-right tabular-nums ${
                                  left < 0 ? "text-clay" : ""
                                }`}
                              >
                                {pesoNumber(left)}
                              </td>
                              <td className="border-b border-line px-2">
                                <input
                                  aria-label={`Vendor for ${line.name}`}
                                  className="h-10 w-36 bg-transparent text-sm outline-none"
                                  value={line.vendor}
                                  onChange={(event) =>
                                    updateLine(line.id, { vendor: event.target.value })
                                  }
                                />
                              </td>
                              <td className="border-b border-line px-2">
                                <select
                                  aria-label={`Status for ${line.name}`}
                                  className="h-10 bg-transparent text-sm"
                                  value={line.status}
                                  onChange={(event) =>
                                    updateLine(line.id, { status: event.target.value as Status })
                                  }
                                >
                                  {STATUSES.map((status) => (
                                    <option key={status.id} value={status.id}>
                                      {status.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="border-b border-line px-2">
                                <select
                                  aria-label={`Who pays for ${line.name}`}
                                  className="h-10 bg-transparent text-sm"
                                  value={line.payer}
                                  onChange={(event) =>
                                    updateLine(line.id, { payer: event.target.value as Payer })
                                  }
                                >
                                  <option value="contractor">Contractor</option>
                                  <option value="owner">You pay</option>
                                </select>
                              </td>
                              <td className="border-b border-line px-2">
                                <button
                                  type="button"
                                  className="h-10 px-2 text-sm text-brass"
                                  onClick={() => onEdit(line.id)}
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })
        )}
        <p className="px-4 py-4 text-xs text-muted">
          Budget = quantity × (supply + labor). Contractor lines are the package. You pay lines are
          additionals. Left is against that line only and does not include VAT or contingency.
        </p>
      </div>
    </div>
  );
}

function MobileRow({
  line,
  paid,
  locked,
  onEdit,
  onActual,
  onPaid,
  onPayer,
}: {
  line: Line;
  paid: number;
  locked: boolean;
  onEdit: () => void;
  onActual: (value: number) => void;
  onPaid: (value: number) => void;
  onPayer: (payer: Payer) => void;
}) {
  const budget = lineBudget(line);
  const over = line.actual > budget && (budget > 0 || line.actual > 0);
  return (
    <div className={`border-b border-line px-4 py-3 ${over ? "bg-clay-soft" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <button type="button" className="min-w-0 flex-1 text-left" onClick={onEdit}>
          <span className="block font-medium">{line.name}</span>
          <span className="mt-0.5 block truncate text-xs text-muted">
            {line.qty} {line.unit} · {statusLabel(line.status)} · {payerLabel(line.payer)}
            {line.vendor ? ` · ${line.vendor}` : ""}
          </span>
        </button>
        <div className="shrink-0 text-right">
          <div className="text-xs text-muted">Budget</div>
          <div className="font-medium tabular-nums">{pesoNumber(budget)}</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-xs text-muted">Billed</span>
          <CellNum label={`Billed for ${line.name}`} value={line.actual} onChange={onActual} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-muted">{locked ? "Paid · cash book" : "Paid"}</span>
          <CellNum
            label={`Paid for ${line.name}`}
            value={paid}
            readOnly={locked}
            onChange={onPaid}
          />
        </label>
      </div>
      <label className="mt-2 block">
        <span className="mb-1 block text-xs text-muted">Who pays</span>
        <select
          aria-label={`Who pays for ${line.name}`}
          className="h-11 w-full rounded-md border border-line bg-paper px-3 text-base"
          value={line.payer}
          onChange={(event) => onPayer(event.target.value as Payer)}
        >
          <option value="contractor">Contractor</option>
          <option value="owner">You pay</option>
        </select>
      </label>
    </div>
  );
}
