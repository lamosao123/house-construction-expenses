import { useEffect, useRef, useState } from "react";
import { CellNum, Field, controlClass } from "@/components/ledger/fields";
import { lineBudget, linkedPayments } from "@/lib/ledger/calc";
import { peso } from "@/lib/ledger/money";
import { useLedger } from "@/lib/ledger/store";
import { PAYERS, STATUSES, UNITS, type Line, type Payer, type Status } from "@/lib/ledger/types";

type Draft = Omit<Line, "id" | "order">;

function blank(phaseId: string): Draft {
  return {
    phaseId,
    name: "",
    spec: "",
    unit: "lot",
    qty: 1,
    materialRate: 0,
    laborRate: 0,
    actual: 0,
    paid: 0,
    vendor: "",
    status: "planned",
    date: "",
    notes: "",
    payer: phaseId === "extras" ? "owner" : "contractor",
  };
}

export function LineDialog({
  mode,
  lineId,
  phaseId,
  onClose,
}: {
  mode: "create" | "edit";
  lineId?: string;
  phaseId: string;
  onClose: () => void;
}) {
  const phases = useLedger((state) => state.phases);
  const line = useLedger((state) => state.lines.find((item) => item.id === lineId));
  const payments = useLedger((state) => state.payments);
  const addLine = useLedger((state) => state.addLine);
  const updateLine = useLedger((state) => state.updateLine);
  const removeLine = useLedger((state) => state.removeLine);
  const ref = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [draft, setDraft] = useState<Draft>(() =>
    mode === "edit" && line
      ? {
          phaseId: line.phaseId,
          name: line.name,
          spec: line.spec,
          unit: line.unit,
          qty: line.qty,
          materialRate: line.materialRate,
          laborRate: line.laborRate,
          actual: line.actual,
          paid: line.paid,
          vendor: line.vendor,
          status: line.status,
          date: line.date,
          notes: line.notes,
          payer: line.payer ?? "contractor",
        }
      : blank(phaseId),
  );
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    const handleClose = () => onCloseRef.current();
    dialog.addEventListener("close", handleClose);
    return () => {
      dialog.removeEventListener("close", handleClose);
      if (dialog.open) dialog.close();
    };
  }, []);

  const linked = lineId ? linkedPayments(lineId, payments) : [];
  const paidLocked = linked.length > 0;
  const previewBudget = lineBudget({
    ...draft,
    id: "draft",
    order: 0,
  });

  function patch(partial: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...partial }));
  }

  function save() {
    const name = draft.name.trim();
    if (!name) {
      setError("Name the line before saving.");
      return;
    }
    const next = { ...draft, name };
    if (mode === "edit" && lineId) updateLine(lineId, next);
    else addLine(next);
    onClose();
  }

  function duplicate() {
    const name = draft.name.trim();
    if (!name) {
      setError("Name the line before duplicating it.");
      return;
    }
    addLine({ ...draft, name: `${name} copy` });
    onClose();
  }

  function remove() {
    if (!lineId) return;
    if (!window.confirm("Remove this line from the cost book?")) return;
    removeLine(lineId);
    onClose();
  }

  return (
    <dialog
      ref={ref}
      className="ledger-dialog"
      aria-labelledby="line-dialog-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-4">
          <div>
            <p className="text-xs font-medium tracking-widest text-brass uppercase">
              {mode === "create" ? "New line" : "Edit line"}
            </p>
            <h2 id="line-dialog-title" className="mt-1 font-display text-2xl">
              {draft.name.trim() || "Untitled line"}
            </h2>
          </div>
          <button
            type="button"
            className="h-11 rounded-md border border-line px-3 text-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 overflow-auto px-4 py-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Item">
              <input
                className={controlClass}
                value={draft.name}
                autoFocus
                onChange={(event) => patch({ name: event.target.value })}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Spec">
              <input
                className={controlClass}
                value={draft.spec}
                onChange={(event) => patch({ spec: event.target.value })}
              />
            </Field>
          </div>
          <Field label="Scope">
            <select
              className={controlClass}
              value={draft.phaseId}
              onChange={(event) => patch({ phaseId: event.target.value })}
            >
              {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Who pays" hint="The contractor’s package, or an additional you pay yourself.">
            <select
              className={controlClass}
              value={draft.payer}
              onChange={(event) => patch({ payer: event.target.value as Payer })}
            >
              {PAYERS.map((payer) => (
                <option key={payer.id} value={payer.id}>
                  {payer.id === "owner" ? "You pay (additional)" : "Contractor"}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              className={controlClass}
              value={draft.status}
              onChange={(event) => patch({ status: event.target.value as Status })}
            >
              {STATUSES.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Unit">
            <input
              className={controlClass}
              list="ledger-units"
              value={draft.unit}
              onChange={(event) => patch({ unit: event.target.value })}
            />
            <datalist id="ledger-units">
              {UNITS.map((unit) => (
                <option key={unit} value={unit} />
              ))}
            </datalist>
          </Field>
          <Field label="Quantity">
            <CellNum label="Quantity" value={draft.qty} onChange={(qty) => patch({ qty })} />
          </Field>
          <Field label="Supply rate (₱)" hint="Materials, fixtures, or a contract amount.">
            <CellNum
              label="Supply rate"
              value={draft.materialRate}
              onChange={(materialRate) => patch({ materialRate })}
            />
          </Field>
          <Field label="Labor rate (₱)">
            <CellNum
              label="Labor rate"
              value={draft.laborRate}
              onChange={(laborRate) => patch({ laborRate })}
            />
          </Field>
          <p className="sm:col-span-2 text-sm">
            Budget for this line{" "}
            <span className="font-medium tabular-nums">{peso(previewBudget)}</span>
            <span className="text-muted"> · quantity × (supply + labor)</span>
          </p>
          <Field label="Billed (₱)" hint="Invoice total, tax included if the bill has tax.">
            <CellNum label="Billed" value={draft.actual} onChange={(actual) => patch({ actual })} />
          </Field>
          <Field
            label="Paid (₱)"
            hint={
              paidLocked
                ? "Linked cash-book entries control this. Delete them to type a figure."
                : "Cash already released. Leave it if you will log payments instead."
            }
          >
            <CellNum
              label="Paid"
              value={paidLocked ? linked.reduce((sum, payment) => sum + payment.amount, 0) : draft.paid}
              readOnly={paidLocked}
              onChange={(paid) => patch({ paid })}
            />
          </Field>
          <Field label="Vendor">
            <input
              className={controlClass}
              value={draft.vendor}
              onChange={(event) => patch({ vendor: event.target.value })}
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              className={controlClass}
              value={draft.date}
              onChange={(event) => patch({ date: event.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <textarea
                className={`${controlClass} min-h-24 py-2`}
                value={draft.notes}
                onChange={(event) => patch({ notes: event.target.value })}
              />
            </Field>
          </div>
          {error ? (
            <p className="sm:col-span-2 text-sm text-clay" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-4">
          <button type="submit" className="h-11 rounded-md bg-ink px-4 text-sm font-medium text-paper">
            Save line
          </button>
          {mode === "edit" ? (
            <button
              type="button"
              className="h-11 rounded-md border border-line px-4 text-sm"
              onClick={duplicate}
            >
              Duplicate
            </button>
          ) : null}
          {mode === "edit" ? (
            <button
              type="button"
              className="h-11 rounded-md px-3 text-sm text-clay sm:ml-auto"
              onClick={remove}
            >
              Remove line
            </button>
          ) : null}
        </div>
      </form>
    </dialog>
  );
}
