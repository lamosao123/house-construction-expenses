import { useState } from "react";
import { Field, CellNum, controlClass } from "@/components/ledger/fields";
import { bookTotals, lineBudget, paidOf } from "@/lib/ledger/calc";
import { peso, prettyDate, todayIso } from "@/lib/ledger/money";
import { useLedger } from "@/lib/ledger/store";
import type { Line, Payment } from "@/lib/ledger/types";

type Board = "contractor" | "extras" | "overall";

export function Overview() {
  const project = useLedger((state) => state.project);
  const lines = useLedger((state) => state.lines);
  const payments = useLedger((state) => state.payments);
  const updateProject = useLedger((state) => state.updateProject);
  const addLine = useLedger((state) => state.addLine);
  const updateLine = useLedger((state) => state.updateLine);
  const removeLine = useLedger((state) => state.removeLine);
  const addPayment = useLedger((state) => state.addPayment);
  const updatePayment = useLedger((state) => state.updatePayment);
  const removePayment = useLedger((state) => state.removePayment);
  const [board, setBoard] = useState<Board>("overall");
  const [extraName, setExtraName] = useState("");
  const [extraBilled, setExtraBilled] = useState(0);
  const [extraPaid, setExtraPaid] = useState(0);
  const [extraDate, setExtraDate] = useState(todayIso);
  const [payAmount, setPayAmount] = useState(0);
  const [extraPay, setExtraPay] = useState(0);
  const [extraTarget, setExtraTarget] = useState("");

  const totals = bookTotals(lines, payments, project);
  const fee = project.contractorFee ?? 0;
  const contractorPaid = totals.contractor.paid;
  const contractorLeft = totals.contractor.left;
  const extras = lines.filter((line) => line.payer === "owner");
  const extrasBudget = totals.owner.budget;
  const extrasPaid = totals.owner.paid;
  const extrasLeft = extrasBudget - extrasPaid;
  const allowances = totals.vat + totals.contingency;
  const overallPaid = contractorPaid + extrasPaid;
  const overallLeft = totals.allIn - overallPaid;
  const contractorPayments = payments.filter((payment) => payment.toContractor);
  const extraPayments = payments.filter((payment) => !payment.toContractor);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4 pb-16">
      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Dashboards">
        {(
          [
            ["contractor", "Contractor"],
            ["extras", "Extras"],
            ["overall", "Overall"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={board === id}
            className={`h-11 rounded-md border text-sm font-medium ${
              board === id
                ? "border-ink bg-ink text-paper"
                : "border-line bg-paper text-muted"
            }`}
            onClick={() => setBoard(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {board === "contractor" ? (
        <ContractorBoard
          name={project.contractorName || "Contractor"}
          fee={fee}
          paid={contractorPaid}
          left={contractorLeft}
          count={contractorPayments.length}
          onFee={(contractorFee) => updateProject({ contractorFee })}
          payAmount={payAmount}
          setPayAmount={setPayAmount}
          onPay={() => {
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
          payments={contractorPayments}
          onUpdate={updatePayment}
          onRemove={removePayment}
        />
      ) : null}

      {board === "extras" ? (
        <ExtrasBoard
          budget={extrasBudget}
          paid={extrasPaid}
          left={extrasLeft}
          lines={extras}
          payments={payments}
          extraName={extraName}
          setExtraName={setExtraName}
          extraBilled={extraBilled}
          setExtraBilled={setExtraBilled}
          extraPaid={extraPaid}
          setExtraPaid={setExtraPaid}
          extraDate={extraDate}
          setExtraDate={setExtraDate}
          extraPay={extraPay}
          setExtraPay={setExtraPay}
          extraTarget={extraTarget || extras[0]?.id || ""}
          setExtraTarget={setExtraTarget}
          onAdd={() => {
            const name = extraName.trim();
            if (!name) return;
            const id = addLine({
              phaseId: "extras",
              name,
              spec: "",
              unit: "lot",
              qty: 1,
              materialRate: extraBilled,
              laborRate: 0,
              actual: extraBilled,
              paid: extraPaid,
              vendor: "",
              status: extraPaid > 0 && extraPaid >= extraBilled ? "done" : "planned",
              date: extraDate,
              notes: "",
              payer: "owner",
            });
            setExtraName("");
            setExtraBilled(0);
            setExtraPaid(0);
            setExtraDate(todayIso());
            setExtraTarget(id);
          }}
          onPay={() => {
            const line = extras.find((item) => item.id === (extraTarget || extras[0]?.id));
            if (!line || extraPay <= 0) return;
            addPayment({
              date: todayIso(),
              payee: line.name,
              phaseId: line.phaseId,
              lineId: line.id,
              amount: extraPay,
              method: "cash",
              reference: "",
              note: "",
              toContractor: false,
            });
            setExtraPay(0);
          }}
          onUpdate={updateLine}
          onRemoveLine={removeLine}
          onUpdatePayment={updatePayment}
          onRemovePayment={removePayment}
          extraPayments={extraPayments}
        />
      ) : null}

      {board === "overall" ? (
        <OverallBoard
          allIn={totals.allIn}
          paid={overallPaid}
          left={overallLeft}
          fee={fee}
          contractorPaid={contractorPaid}
          contractorLeft={contractorLeft}
          extrasBudget={extrasBudget}
          extrasPaid={extrasPaid}
          extrasLeft={extrasLeft}
          allowances={allowances}
          vat={totals.vat}
          contingency={totals.contingency}
        />
      ) : null}
    </div>
  );
}

function ContractorBoard({
  name,
  fee,
  paid,
  left,
  count,
  onFee,
  payAmount,
  setPayAmount,
  onPay,
  payments,
  onUpdate,
  onRemove,
}: {
  name: string;
  fee: number;
  paid: number;
  left: number;
  count: number;
  onFee: (next: number) => void;
  payAmount: number;
  setPayAmount: (next: number) => void;
  onPay: () => void;
  payments: Payment[];
  onUpdate: (id: string, patch: Partial<Payment>) => void;
  onRemove: (id: string) => void;
}) {
  const over = left < 0;
  return (
    <>
      <Hero
        kicker={name}
        title={over ? "Over the contract" : "Still owed"}
        value={peso(Math.abs(left))}
        tone={over ? "clay" : "paper"}
        detail={`${peso(paid)} paid of ${peso(fee)} · ${count} payment${count === 1 ? "" : "s"}`}
        ratio={fee > 0 ? paid / fee : 0}
        over={over}
      />
      <section className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line">
        <Tile label="Contract" value={peso(fee)} />
        <Tile label="Paid" value={peso(paid)} />
        <Tile label={over ? "Over" : "Left"} value={peso(Math.abs(left))} clay={over} />
      </section>
      <section className="rounded-lg border border-line bg-paper p-4">
        <Field label="Contract amount">
          <CellNum label="Contractor fee" value={fee} onChange={onFee} />
        </Field>
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            onPay();
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
        <PaymentList
          empty="No contractor payments yet."
          payments={payments}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      </section>
    </>
  );
}

function ExtrasBoard({
  budget,
  paid,
  left,
  lines,
  payments,
  extraName,
  setExtraName,
  extraBilled,
  setExtraBilled,
  extraPaid,
  setExtraPaid,
  extraDate,
  setExtraDate,
  extraPay,
  setExtraPay,
  extraTarget,
  setExtraTarget,
  onAdd,
  onPay,
  onUpdate,
  onRemoveLine,
  onUpdatePayment,
  onRemovePayment,
  extraPayments,
}: {
  budget: number;
  paid: number;
  left: number;
  lines: Line[];
  payments: Parameters<typeof paidOf>[1];
  extraName: string;
  setExtraName: (next: string) => void;
  extraBilled: number;
  setExtraBilled: (next: number) => void;
  extraPaid: number;
  setExtraPaid: (next: number) => void;
  extraDate: string;
  setExtraDate: (next: string) => void;
  extraPay: number;
  setExtraPay: (next: number) => void;
  extraTarget: string;
  setExtraTarget: (next: string) => void;
  onAdd: () => void;
  onPay: () => void;
  onUpdate: (id: string, patch: Partial<Line>) => void;
  onRemoveLine: (id: string) => void;
  onUpdatePayment: (id: string, patch: Partial<Payment>) => void;
  onRemovePayment: (id: string) => void;
  extraPayments: Payment[];
}) {
  const over = left < 0;
  return (
    <>
      <Hero
        kicker="Additional costs"
        title={over ? "Over the extras" : "Extras still to pay"}
        value={peso(Math.abs(left))}
        tone={over ? "clay" : "paper"}
        detail={`${peso(paid)} paid of ${peso(budget)} · ${lines.length} item${lines.length === 1 ? "" : "s"}`}
        ratio={budget > 0 ? paid / budget : 0}
        over={over}
      />
      <section className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line">
        <Tile label="Billed" value={peso(budget)} />
        <Tile label="Paid" value={peso(paid)} />
        <Tile label={over ? "Over" : "Left"} value={peso(Math.abs(left))} clay={over} />
      </section>
      <section className="rounded-lg border border-line bg-paper">
        {lines.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted">No extras yet. Add electricity, a tank, or anything outside the contract.</p>
        ) : (
          <ul>
            {lines.map((line) => {
              const billed = lineBudget(line);
              const linePaid = paidOf(line, payments);
              const lineLeft = billed - linePaid;
              const ratio = billed > 0 ? Math.min(linePaid / billed, 1) : 0;
              const locked = payments.some((payment) => payment.lineId === line.id && !payment.toContractor);
              return (
                <li key={line.id} className="border-b border-line px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{line.name}</p>
                    <button
                      type="button"
                      className="h-11 shrink-0 px-2 text-sm text-clay"
                      onClick={() => onRemoveLine(line.id)}
                    >
                      Remove
                    </button>
                  </div>
                  <Meter ratio={ratio} over={lineLeft < 0} />
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted">Billed</p>
                      <CellNum
                        label={`Billed for ${line.name}`}
                        value={line.materialRate}
                        onChange={(next) =>
                          onUpdate(line.id, { materialRate: next, actual: next, qty: 1, laborRate: 0 })
                        }
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted">Paid</p>
                      <CellNum
                        label={`Paid for ${line.name}`}
                        value={linePaid}
                        readOnly={locked}
                        onChange={(next) => onUpdate(line.id, { paid: next })}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted">Date</p>
                      <input
                        type="date"
                        className={controlClass}
                        aria-label={`Date of ${line.name}`}
                        value={line.date}
                        onChange={(event) => onUpdate(line.id, { date: event.target.value })}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted">{lineLeft < 0 ? "Over" : "Left"}</p>
                      <p className={`pt-2 font-medium tabular-nums ${lineLeft < 0 ? "text-clay" : ""}`}>
                        {peso(Math.abs(lineLeft))}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <form
          className="grid gap-3 border-t border-line p-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            onAdd();
          }}
        >
          <Field label="Additional cost">
            <input
              className={controlClass}
              placeholder="Electricity, water tank…"
              aria-label="Additional cost name"
              value={extraName}
              onChange={(event) => setExtraName(event.target.value)}
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              className={controlClass}
              aria-label="Date of the additional cost"
              value={extraDate}
              onChange={(event) => setExtraDate(event.target.value)}
            />
          </Field>
          <Field label="Billed">
            <CellNum label="Billed amount" value={extraBilled} onChange={setExtraBilled} />
          </Field>
          <Field label="Paid">
            <CellNum label="Paid amount" value={extraPaid} onChange={setExtraPaid} />
          </Field>
          <button type="submit" className="h-11 rounded-md bg-ink px-4 text-sm font-medium text-paper sm:col-span-2">
            Add cost
          </button>
        </form>
      </section>
      {lines.length > 0 ? (
        <section className="rounded-lg border border-line bg-paper p-4">
          <h2 className="font-display text-2xl">Pay an extra</h2>
          <form
            className="mt-4 grid gap-3 sm:grid-cols-[1fr_9rem_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              onPay();
            }}
          >
            <Field label="Which cost">
              <select
                className={controlClass}
                value={extraTarget}
                onChange={(event) => setExtraTarget(event.target.value)}
              >
                {lines.map((line) => (
                  <option key={line.id} value={line.id}>
                    {line.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Amount">
              <CellNum label="Extra payment" value={extraPay} onChange={setExtraPay} />
            </Field>
            <button
              type="submit"
              className="h-11 self-end rounded-md bg-ink px-4 text-sm font-medium text-paper"
            >
              Record
            </button>
          </form>
          <PaymentList
            empty="No extra payments yet. Typed amounts on a cost also count as paid."
            payments={extraPayments}
            onUpdate={onUpdatePayment}
            onRemove={onRemovePayment}
          />
        </section>
      ) : null}
    </>
  );
}

function OverallBoard({
  allIn,
  paid,
  left,
  fee,
  contractorPaid,
  contractorLeft,
  extrasBudget,
  extrasPaid,
  extrasLeft,
  allowances,
  vat,
  contingency,
}: {
  allIn: number;
  paid: number;
  left: number;
  fee: number;
  contractorPaid: number;
  contractorLeft: number;
  extrasBudget: number;
  extrasPaid: number;
  extrasLeft: number;
  allowances: number;
  vat: number;
  contingency: number;
}) {
  const over = left < 0;
  const slices = [
    { label: "Contractor", amount: fee, paid: contractorPaid, left: contractorLeft },
    { label: "Extras", amount: extrasBudget, paid: extrasPaid, left: extrasLeft },
    { label: "VAT & contingency", amount: allowances, paid: 0, left: allowances },
  ];
  return (
    <>
      <Hero
        kicker="Whole house"
        title={over ? "Over the plan" : "Overall still to fund"}
        value={peso(Math.abs(left))}
        tone={over ? "clay" : "paper"}
        detail={`${peso(paid)} paid of ${peso(allIn)} project total`}
        ratio={allIn > 0 ? paid / allIn : 0}
        over={over}
      />
      <section className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line">
        <Tile label="Project total" value={peso(allIn)} />
        <Tile label="Paid out" value={peso(paid)} />
        <Tile label={over ? "Over" : "Left"} value={peso(Math.abs(left))} clay={over} />
      </section>
      <section className="rounded-lg border border-line bg-paper p-4">
        <h2 className="font-display text-2xl">Where the total comes from</h2>
        <Split
          parts={[
            { label: "Contractor", value: fee, className: "bg-ink" },
            { label: "Extras", value: extrasBudget, className: "bg-brass" },
            { label: "Allowances", value: allowances, className: "bg-line" },
          ]}
        />
        <ul className="mt-4">
          {slices.map((slice) => (
            <li key={slice.label} className="border-t border-line py-3 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{slice.label}</span>
                <span className="tabular-nums">{peso(slice.amount)}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-3 text-muted">
                <span className="tabular-nums">{peso(slice.paid)} paid</span>
                <span className={`tabular-nums ${slice.left < 0 ? "text-clay" : ""}`}>
                  {peso(Math.abs(slice.left))} {slice.left < 0 ? "over" : "left"}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">
          VAT {peso(vat)} · contingency {peso(contingency)}. Allowances are not a payment until you spend them.
        </p>
      </section>
    </>
  );
}

function Hero({
  kicker,
  title,
  value,
  detail,
  ratio,
  over,
  tone,
}: {
  kicker: string;
  title: string;
  value: string;
  detail: string;
  ratio: number;
  over: boolean;
  tone: "paper" | "clay";
}) {
  return (
    <section className={`rounded-lg p-4 ${tone === "clay" ? "bg-clay text-paper" : "bg-ink text-paper"}`}>
      <p className="text-xs font-medium tracking-widest text-brass-bright uppercase">{kicker}</p>
      <h2 className="mt-2 font-display text-3xl">{title}</h2>
      <p className="mt-1 font-display text-4xl tabular-nums">{value}</p>
      <p className="mt-2 text-sm text-on-ink">{detail}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink-line">
        <span
          className={`block h-2 ${over ? "bg-clay-soft" : "bg-brass-bright"}`}
          style={{ width: `${Math.max(0, Math.min(ratio, 1)) * 100}%` }}
        />
      </div>
    </section>
  );
}

function Tile({ label, value, clay = false }: { label: string; value: string; clay?: boolean }) {
  return (
    <div className="bg-paper px-3 py-3">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
      <p className={`mt-1 text-lg font-medium tabular-nums ${clay ? "text-clay" : ""}`}>{value}</p>
    </div>
  );
}

function Meter({ ratio, over }: { ratio: number; over: boolean }) {
  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
      <span
        className={`block h-1.5 ${over ? "bg-clay" : "bg-brass"}`}
        style={{ width: `${Math.max(0, Math.min(ratio, 1)) * 100}%` }}
      />
    </div>
  );
}

function Split({
  parts,
}: {
  parts: { label: string; value: number; className: string }[];
}) {
  const total = parts.reduce((sum, part) => sum + Math.max(0, part.value), 0);
  return (
    <div className="mt-4">
      <div className="flex h-3 overflow-hidden rounded-full bg-line">
        {parts.map((part) => (
          <span
            key={part.label}
            className={part.className}
            style={{ width: total > 0 ? `${(Math.max(0, part.value) / total) * 100}%` : "0%" }}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {parts.map((part) => (
          <span key={part.label} className="inline-flex items-center gap-1">
            <span className={`inline-block h-2 w-2 ${part.className}`} />
            {part.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function PaymentList({
  payments,
  empty,
  onUpdate,
  onRemove,
}: {
  payments: Payment[];
  empty: string;
  onUpdate: (id: string, patch: Partial<Payment>) => void;
  onRemove: (id: string) => void;
}) {
  if (payments.length === 0) return <p className="mt-3 text-sm text-muted">{empty}</p>;
  return (
    <ul className="mt-4 border-t border-line">
      {payments.map((payment) => (
        <PaymentRow key={payment.id} payment={payment} onUpdate={onUpdate} onRemove={onRemove} />
      ))}
    </ul>
  );
}

export function PaymentRow({
  payment,
  detail,
  onUpdate,
  onRemove,
}: {
  payment: Payment;
  detail?: string;
  onUpdate: (id: string, patch: Partial<Payment>) => void;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <li className="border-b border-line py-3 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium">{payment.payee || "Payment"}</div>
          <div className="text-xs text-muted">{detail || prettyDate(payment.date) || "No date"}</div>
        </div>
        <div className="font-medium tabular-nums">{peso(payment.amount)}</div>
      </div>
      {open ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Field label="Amount">
            <CellNum
              label={`Amount for ${payment.payee || "payment"}`}
              value={payment.amount}
              onChange={(amount) => onUpdate(payment.id, { amount })}
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              className={controlClass}
              aria-label={`Date for ${payment.payee || "payment"}`}
              value={payment.date}
              onChange={(event) => onUpdate(payment.id, { date: event.target.value })}
            />
          </Field>
        </div>
      ) : null}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className="h-11 flex-1 rounded-md border border-line text-sm"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Done" : "Edit"}
        </button>
        <button
          type="button"
          className="h-11 flex-1 rounded-md border border-line text-sm text-clay"
          onClick={() => onRemove(payment.id)}
        >
          Remove
        </button>
      </div>
    </li>
  );
}
