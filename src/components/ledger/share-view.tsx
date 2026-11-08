import { useEffect, useState } from "react";
import { bookTotals, lineBudget, paidOf } from "@/lib/ledger/calc";
import { loadSharedBook, type BookPayload } from "@/lib/ledger/book";
import { peso, prettyDate } from "@/lib/ledger/money";

export function ShareView({ token }: { token: string }) {
  const [book, setBook] = useState<BookPayload | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let stop = false;
    async function pull() {
      try {
        const next = await loadSharedBook({ data: token });
        if (stop) return;
        if (!next) setMissing(true);
        else {
          setMissing(false);
          setBook(next);
        }
      } catch {
        if (!stop) setMissing(true);
      }
    }
    void pull();
    const timer = window.setInterval(() => void pull(), 8000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [token]);

  if (missing) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg px-4 text-ink">
        <p className="text-sm text-muted">This link does not have a book yet.</p>
      </main>
    );
  }

  if (!book) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg px-4 text-ink">
        <p className="text-sm text-muted">Opening the book…</p>
      </main>
    );
  }

  const totals = bookTotals(book.lines, book.payments, book.project);
  const extras = book.lines.filter((line) => line.payer === "owner");
  const extrasLeft = totals.owner.budget - totals.owner.paid;
  const overallPaid = totals.contractor.paid + totals.owner.paid;
  const overallLeft = totals.allIn - overallPaid;
  const contractorPays = book.payments.filter((payment) => payment.toContractor);

  return (
    <main className="min-h-dvh bg-bg text-ink">
      <header className="bg-ink px-4 py-5 text-paper">
        <div className="mx-auto w-full max-w-5xl">
          <p className="text-xs font-medium tracking-widest text-brass-bright uppercase">Shared view</p>
          <h1 className="mt-1 font-display text-3xl">{book.project.name}</h1>
          <p className="mt-1 text-sm text-on-ink">You can look. Only the owner can change the numbers.</p>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4 pb-16">
        <section className="rounded-lg bg-ink p-4 text-paper">
          <p className="text-xs font-medium tracking-widest text-brass-bright uppercase">Overall</p>
          <p className="mt-2 font-display text-4xl tabular-nums">{peso(Math.abs(overallLeft))}</p>
          <p className="mt-1 text-sm text-on-ink">
            {overallLeft < 0 ? "Over the plan" : "Still to fund"} · {peso(overallPaid)} paid of {peso(totals.allIn)}
          </p>
        </section>
        <section className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line">
          <Cell label="Contractor left" value={peso(Math.abs(totals.contractor.left))} />
          <Cell label="Extras left" value={peso(Math.abs(extrasLeft))} />
          <Cell label="Paid out" value={peso(overallPaid)} />
        </section>
        <section className="rounded-lg border border-line bg-paper p-4">
          <h2 className="font-display text-2xl">{book.project.contractorName || "Contractor"}</h2>
          <p className="mt-2 text-sm text-muted">
            Contract {peso(totals.contractor.budget)} · paid {peso(totals.contractor.paid)} · left{" "}
            {peso(Math.abs(totals.contractor.left))}
          </p>
          {contractorPays.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No contractor payments yet.</p>
          ) : (
            <ul className="mt-3 border-t border-line">
              {contractorPays.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-b-0">
                  <span className="text-sm text-muted">{prettyDate(payment.date) || "No date"}</span>
                  <span className="font-medium tabular-nums">{peso(payment.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-lg border border-line bg-paper">
          <div className="border-b border-line px-4 py-4">
            <h2 className="font-display text-2xl">Additional costs</h2>
            <p className="mt-1 text-sm text-muted">
              Billed {peso(totals.owner.budget)} · paid {peso(totals.owner.paid)} · left {peso(Math.abs(extrasLeft))}
            </p>
          </div>
          {extras.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted">No extras yet.</p>
          ) : (
            <ul>
              {extras.map((line) => {
                const billed = lineBudget(line);
                const paid = paidOf(line, book.payments);
                const left = billed - paid;
                return (
                  <li key={line.id} className="border-b border-line px-4 py-3 last:border-b-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-medium">{line.name}</p>
                      <p className="text-xs text-muted">{prettyDate(line.date) || "No date"}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      Billed {peso(billed)} · paid {peso(paid)} · {left < 0 ? "over" : "left"} {peso(Math.abs(left))}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-paper px-3 py-3">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-1 text-lg font-medium tabular-nums">{value}</p>
    </div>
  );
}
