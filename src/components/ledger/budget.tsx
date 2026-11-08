import { useState } from "react";
import { Field, CellNum, controlClass } from "@/components/ledger/fields";
import { bookTotals, lineBudget, perSqm } from "@/lib/ledger/calc";
import { peso } from "@/lib/ledger/money";
import { useLedger } from "@/lib/ledger/store";

export function BudgetPage() {
  const project = useLedger((state) => state.project);
  const lines = useLedger((state) => state.lines);
  const payments = useLedger((state) => state.payments);
  const updateProject = useLedger((state) => state.updateProject);
  const addLine = useLedger((state) => state.addLine);
  const updateLine = useLedger((state) => state.updateLine);
  const removeLine = useLedger((state) => state.removeLine);
  const reset = useLedger((state) => state.reset);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState(0);

  const totals = bookTotals(lines, payments, project);
  const fee = project.contractorFee ?? 0;
  const costs = lines.filter((line) => line.payer === "owner");
  const perMeter = perSqm(totals.allIn, project.floorArea);

  function addCost() {
    const next = name.trim();
    if (!next) return;
    addLine({
      phaseId: "extras",
      name: next,
      spec: "",
      unit: "lot",
      qty: 1,
      materialRate: amount,
      laborRate: 0,
      actual: 0,
      paid: 0,
      vendor: "",
      status: "planned",
      date: "",
      notes: "",
      payer: "owner",
    });
    setName("");
    setAmount(0);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-4 pb-16">
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
        <Figure label="Contractor" value={peso(fee)} />
        <Figure label="Other costs" value={peso(totals.owner.budget)} />
        <Figure label="Contingency" value={peso(totals.contingency)} />
        <Figure label="Project budget" value={peso(totals.allIn)} />
      </section>
      <p className="text-sm text-muted">
        {perMeter === null
          ? "Set a floor area to see the budget per square meter."
          : `${peso(perMeter)} per sqm on ${project.floorArea} sqm.`}
        {totals.vat > 0 ? ` VAT is ${peso(totals.vat)}.` : " VAT is off."}
      </p>

      <section className="rounded-lg border border-line bg-paper p-4">
        <h2 className="font-display text-2xl">Contractor</h2>
        <p className="mt-1 text-sm text-muted">The contract you will pay them. This is not an additional cost.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Contractor name">
            <input
              className={controlClass}
              value={project.contractorName}
              onChange={(event) => updateProject({ contractorName: event.target.value })}
            />
          </Field>
          <Field label="Contract budget">
            <CellNum
              label="Contract budget"
              value={fee}
              onChange={(contractorFee) => updateProject({ contractorFee })}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-paper">
        <div className="border-b border-line px-4 py-4">
          <h2 className="font-display text-2xl">Project costs</h2>
          <p className="mt-1 text-sm text-muted">
            Set the budget for each cost you pay yourself. Payments stay on Overview.
          </p>
        </div>
        {costs.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted">No project costs yet. Add the first one below.</p>
        ) : (
          <ul>
            {costs.map((line) => (
              <li key={line.id} className="border-b border-line px-4 py-3">
                <div className="flex items-center gap-2">
                  <input
                    aria-label={`Name of ${line.name}`}
                    className="h-11 min-w-0 flex-1 rounded-md border border-line bg-paper px-3 text-base"
                    value={line.name}
                    onChange={(event) => updateLine(line.id, { name: event.target.value })}
                    onBlur={(event) => {
                      const next = event.target.value.trim();
                      updateLine(line.id, { name: next || "Untitled cost" });
                    }}
                  />
                  <button
                    type="button"
                    className="h-11 shrink-0 px-1 text-sm text-clay"
                    onClick={() => {
                      if (window.confirm(`Remove ${line.name} from the budget?`)) removeLine(line.id);
                    }}
                  >
                    Remove
                  </button>
                </div>
                <label className="mt-2 block">
                  <span className="mb-1 block text-xs text-muted">Budget</span>
                  <CellNum
                    label={`Budget for ${line.name}`}
                    value={lineBudget(line)}
                    onChange={(materialRate) =>
                      updateLine(line.id, { materialRate, qty: 1, laborRate: 0 })
                    }
                  />
                </label>
              </li>
            ))}
          </ul>
        )}
        <form
          className="flex flex-col gap-2 border-t border-line p-4 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            addCost();
          }}
        >
          <input
            className={controlClass}
            placeholder="Permits, electricity, water tank…"
            aria-label="New project cost"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <div className="sm:w-40">
            <CellNum label="New project cost budget" value={amount} onChange={setAmount} />
          </div>
          <button
            type="submit"
            className="h-11 shrink-0 rounded-md bg-ink px-4 text-sm font-medium text-paper"
          >
            Add cost
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-line bg-paper p-4">
        <h2 className="font-display text-2xl">Allowances</h2>
        <p className="mt-1 text-sm text-muted">
          Contingency is a percent of the contractor plus project costs, after VAT.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Contingency (%)" hint={peso(totals.contingency)}>
            <CellNum
              label="Contingency percent"
              value={project.contingencyPct}
              onChange={(contingencyPct) =>
                updateProject({ contingencyPct: Math.min(100, contingencyPct) })
              }
            />
          </Field>
          <Field label="VAT (%)" hint={totals.vat > 0 ? peso(totals.vat) : "Off"}>
            <CellNum
              label="VAT percent"
              value={project.vatPct}
              onChange={(vatPct) => updateProject({ vatPct: Math.min(100, vatPct) })}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-paper p-4">
        <h2 className="font-display text-2xl">Project</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Project name">
            <input
              className={controlClass}
              value={project.name}
              onChange={(event) => updateProject({ name: event.target.value })}
            />
          </Field>
          <Field label="Location">
            <input
              className={controlClass}
              value={project.location}
              onChange={(event) => updateProject({ location: event.target.value })}
            />
          </Field>
          <Field label="Floor area (sqm)">
            <CellNum
              label="Floor area"
              value={project.floorArea}
              onChange={(floorArea) => updateProject({ floorArea })}
            />
          </Field>
          <Field label="Storeys">
            <CellNum
              label="Storeys"
              value={project.stories}
              onChange={(stories) => updateProject({ stories: Math.max(1, Math.round(stories)) })}
            />
          </Field>
          <Field label="Start">
            <input
              type="date"
              className={controlClass}
              value={project.startDate}
              onChange={(event) => updateProject({ startDate: event.target.value })}
            />
          </Field>
          <Field label="Target finish">
            <input
              type="date"
              className={controlClass}
              value={project.targetDate}
              onChange={(event) => updateProject({ targetDate: event.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Note">
              <textarea
                className={`${controlClass} min-h-24 py-2`}
                value={project.notes}
                onChange={(event) => updateProject({ notes: event.target.value })}
              />
            </Field>
          </div>
        </div>
        <button
          type="button"
          className="mt-6 h-11 rounded-md border border-line px-4 text-sm text-clay"
          onClick={() => {
            if (
              window.confirm(
                "Clear this book? The budget, payments, and project costs on this device will be removed.",
              )
            ) {
              reset();
            }
          }}
        >
          Clear the book
        </button>
      </section>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-paper px-3 py-3">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-1 text-lg font-medium tabular-nums">{value}</p>
    </div>
  );
}
