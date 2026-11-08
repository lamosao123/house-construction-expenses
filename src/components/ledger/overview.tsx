import { useState } from "react";
import { Field, CellNum, controlClass } from "@/components/ledger/fields";
import { bookTotals, lineBudget, paidOf } from "@/lib/ledger/calc";
import { peso, prettyDate, todayIso } from "@/lib/ledger/money";
import { useLedger } from "@/lib/ledger/store";

export function Overview({
  onOpenPhase,
  onOpenAdditionals,
}: {
  onOpenPhase: (phaseId: string) => void;
  onOpenAdditionals: () => void;
}) {
  const project = useLedger((state) => state.project);
  const lines = useLedger((state) => state.lines);
  const payments = useLedger((state) => state.payments);
  const updateProject = useLedger((state) => state.updateProject);
  const addLine = useLedger((state) => state.addLine);
  const updateLine = useLedger((state) => state.updateLine);
  const removeLine = useLedger((state) => state.removeLine);
  const addPayment = useLedger((state) => state.addPayment);
  const removePayment = useLedger((state) => state.removePayment);
  const [extraName, setExtraName] = useState("");
  const [extraCost, setExtraCost] = useState(0);
  const [payAmount, setPayAmount] = useState(0);

  const totals = bookTotals(lines, payments, project);
  const fee = project.contractorFee ?? 0;
  const paid = totals.contractor.paid;
  const remaining = totals.contractor.left;
  const additionals = lines.filter((line) => line.payer === "owner");
  const additionalPaid = totals.owner.paid;
  const additionalLeft = totals.owner.budget - additionalPaid;
  const contractorPayments = payments.filter((payment) => payment.toContractor);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4 pb-16">
      <section className="rounded-lg border border-line bg-paper p-4">
        <h2 className="font-display text-2xl">{project.contractorName || "Contractor"}</h2>
        <p className="mt-1 text-sm text-muted">
          Type the full contract. Payments here are only money to the contractor. Additionals stay separate.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Total contract">
            <CellNum
              label="Contractor fee"
              value={fee}
              onChange={(contractorFee) => updateProject({ contractorFee })}
            />
          </Field>
          <Stat label="Paid" value={peso(paid)} hint="Payments to the contractor" />
          <Stat
            label={remaining < 0 ? "Over the contract" : "Remaining"}
            value={peso(Math.abs(remaining))}
            hint={remaining < 0 ? "Paid is past the contract" : "Still owed on the contract"}
            tone={remaining < 0 ? "clay" : "ink"}
          />
        </div>
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            if (payAmount <= 0) return;
            addPayment({
              date: todayIso(),
              payee: project.contractorName || "Contractor",
              phaseId: "",
              lineId: "",
              amount: payAmount,
              method: "bank",
              reference: "",
              note: "",
              toContractor: true,
            });
            setPayAmount(0);
          }}
        >
          <div className="min-w-0 flex-1">
            <Field label="Payment to the contractor">
              <CellNum label="Contractor payment" value={payAmount} onChange={setPayAmount} />
            </Field>
          </div>
          <button
            type="submit"
            className="h-11 shrink-0 self-end rounded-md bg-ink px-4 text-sm font-medium text-paper"
          >
            Record payment
          </button>
        </form>
        {contractorPayments.length > 0 ? (
          <ul className="mt-4 border-t border-line">
            {contractorPayments.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-b-0">
                <div className="min-w-0">
                  <div className="font-medium">{payment.payee}</div>
                  <div className="text-xs text-muted">{prettyDate(payment.date) || "No date"}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium tabular-nums">{peso(payment.amount)}</div>
                  <button
                    type="button"
                    className="text-sm text-clay"
                    onClick={() => removePayment(payment.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">No contractor payments yet.</p>
        )}
      </section>

      <section className="rounded-lg border border-line bg-paper">
        <div className="border-b border-line px-4 py-4">
          <h2 className="font-display text-2xl">Additional costs</h2>
          <p className="mt-1 text-sm text-muted">
            Electricity, water tanks, and anything else that is not the contractor. {peso(totals.owner.budget)} total
            {" · "}
            {peso(additionalPaid)} paid
            {" · "}
            {peso(Math.abs(additionalLeft))} {additionalLeft < 0 ? "over" : "remaining"}.
          </p>
        </div>
        {additionals.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted">None yet. Add the first cost below.</p>
        ) : (
          <ul>
            {additionals.map((line) => {
              const cost = lineBudget(line);
              const linePaid = paidOf(line, payments);
              const left = cost - linePaid;
              const locked = payments.some((payment) => payment.lineId === line.id && !payment.toContractor);
              return (
                <li key={line.id} className="border-b border-line px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{line.name}</p>
                    <button
                      type="button"
                      className="text-sm text-clay"
                      onClick={() => {
                        if (window.confirm(`Remove ${line.name}?`)) removeLine(line.id);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <label className="block">
                      <span className="mb-1 block text-xs text-muted">Cost</span>
                      <CellNum
                        label={`Cost of ${line.name}`}
                        value={line.materialRate}
                        onChange={(materialRate) =>
                          updateLine(line.id, { materialRate, qty: 1, laborRate: 0 })
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs text-muted">{locked ? "Paid" : "Paid"}</span>
                      <CellNum
                        label={`Paid for ${line.name}`}
                        value={linePaid}
                        readOnly={locked}
                        onChange={(next) => updateLine(line.id, { paid: next })}
                      />
                    </label>
                    <div>
                      <span className="mb-1 block text-xs text-muted">Remaining</span>
                      <p className={`pt-2 text-base font-medium tabular-nums ${left < 0 ? "text-clay" : ""}`}>
                        {peso(Math.abs(left))}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <form
          className="flex flex-col gap-2 border-t border-line p-4 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            const name = extraName.trim();
            if (!name) return;
            addLine({
              phaseId: "extras",
              name,
              spec: "",
              unit: "lot",
              qty: 1,
              materialRate: extraCost,
              laborRate: 0,
              actual: 0,
              paid: 0,
              vendor: "",
              status: "planned",
              date: "",
              notes: "",
              payer: "owner",
            });
            setExtraName("");
            setExtraCost(0);
          }}
        >
          <input
            className={controlClass}
            placeholder="Electricity connection, water tank…"
            aria-label="Additional cost name"
            value={extraName}
            onChange={(event) => setExtraName(event.target.value)}
          />
          <div className="sm:w-40">
            <CellNum label="Additional cost" value={extraCost} onChange={setExtraCost} />
          </div>
          <button
            type="submit"
            className="h-11 shrink-0 rounded-md bg-ink px-4 text-sm font-medium text-paper"
          >
            Add cost
          </button>
        </form>
      </section>


      <details className="rounded-lg border border-line bg-paper px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium">How the totals work</summary>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>Set the contract and each project cost on Budget. Record what you have paid on this page.</li>
          <li>Additional costs are everything else. Their remaining is the cost minus what you have paid on that item.</li>
          <li>A payment to the contractor is never counted as an additional, and the other way around.</li>
          <li>Saved on this device only. Download the CSV if you want a copy.</li>
        </ul>
      </details>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone = "ink",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "ink" | "clay";
}) {
  return (
    <div className="bg-paper px-3 py-3">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
      <p className={`mt-1 text-xl font-medium tabular-nums ${tone === "clay" ? "text-clay" : "text-ink"}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}
