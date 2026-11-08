import { useState } from "react";
import { Field, CellNum, controlClass } from "@/components/ledger/fields";
import { bookTotals } from "@/lib/ledger/calc";
import { peso, prettyDate, todayIso } from "@/lib/ledger/money";
import { useLedger } from "@/lib/ledger/store";
import { METHODS, methodLabel, type PayMethod } from "@/lib/ledger/types";

export function CashBook() {
  const lines = useLedger((state) => state.lines);
  const payments = useLedger((state) => state.payments);
  const project = useLedger((state) => state.project);
  const addPayment = useLedger((state) => state.addPayment);
  const removePayment = useLedger((state) => state.removePayment);

  const [date, setDate] = useState(todayIso);
  const [payee, setPayee] = useState("");
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PayMethod>("bank");
  const [lineId, setLineId] = useState("contractor");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const totals = bookTotals(lines, payments, project);
  const additionals = lines.filter((line) => line.payer === "owner");
  const toContractor = lineId === "contractor";
  const linked = additionals.find((line) => line.id === lineId);

  function submit() {
    if (amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!toContractor && !linked) {
      setError("Choose the contractor or an additional.");
      return;
    }
    addPayment({
      date,
      payee: payee.trim() || (toContractor ? project.contractorName || "Contractor" : linked?.name || "Additional"),
      phaseId: linked?.phaseId ?? "",
      lineId: toContractor ? "" : lineId,
      amount,
      method,
      reference: reference.trim(),
      note: note.trim(),
      toContractor,
    });
    setPayee("");
    setAmount(0);
    setReference("");
    setNote("");
    setError("");
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-4 pb-16">
      <section className="rounded-lg border border-line bg-paper p-4">
        <h2 className="font-display text-2xl">Record a payment</h2>
        <p className="mt-1 text-sm text-muted">
          Choose the contractor or one additional. Contractor payments do not reduce an additional, and the other way around.
        </p>
        <form
          className="mt-4 grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Field label="Date">
            <input
              type="date"
              className={controlClass}
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </Field>
          <Field label="Amount (₱)">
            <CellNum label="Payment amount" value={amount} onChange={setAmount} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Paid to">
              <input
                className={controlClass}
                value={payee}
                onChange={(event) => setPayee(event.target.value)}
              />
            </Field>
          </div>
          <Field label="Method">
            <select
              className={controlClass}
              value={method}
              onChange={(event) => setMethod(event.target.value as PayMethod)}
            >
              {METHODS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Reference">
            <input
              className={controlClass}
              value={reference}
              placeholder="Check no., transfer, receipt"
              onChange={(event) => setReference(event.target.value)}
            />
          </Field>
          <Field label="This payment is">
            <select
              className={controlClass}
              value={lineId}
              onChange={(event) => setLineId(event.target.value)}
            >
              <option value="contractor">Payment to the contractor</option>
              {additionals.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Note">
              <input
                className={controlClass}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>
          </div>
          {error ? (
            <p className="sm:col-span-2 text-sm text-clay" role="alert">
              {error}
            </p>
          ) : null}
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="h-11 rounded-md bg-ink px-4 text-sm font-medium text-paper"
            >
              Add payment
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-line bg-paper">
        <div className="border-b border-line px-4 py-4">
          <h2 className="font-display text-2xl">Cash book</h2>
          <p className="mt-1 text-sm text-muted">
            {peso(totals.contractor.paid)} paid to the contractor · {peso(totals.owner.paid)} paid on additionals.
          </p>
        </div>
        {payments.length === 0 ? (
          <p className="px-4 py-8 text-sm text-muted">
            No payments yet. Record the first release of cash, a transfer, GCash, or a check.
          </p>
        ) : (
          <ul>
            {payments.map((payment) => {
              const line = lines.find((item) => item.id === payment.lineId);
              return (
                <li
                  key={payment.id}
                  className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{payment.payee}</div>
                    <div className="mt-0.5 text-xs text-muted">
                      {prettyDate(payment.date) || "No date"} · {methodLabel(payment.method)}
                      {payment.toContractor ? " · Contractor" : ""}
                      {line ? ` · ${line.name}` : ""}
                      {payment.reference ? ` · ${payment.reference}` : ""}
                    </div>
                    {payment.note ? <div className="mt-1 text-sm">{payment.note}</div> : null}
                  </div>
                  <div className="text-right">
                    <div className="font-medium tabular-nums">{peso(payment.amount)}</div>
                    <button
                      type="button"
                      className="mt-1 text-sm text-clay"
                      onClick={() => {
                        if (window.confirm("Remove this payment?")) removePayment(payment.id);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
