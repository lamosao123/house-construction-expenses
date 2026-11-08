import { useLedger } from "@/lib/ledger/store";

export function ShareBar() {
  const editedAt = useLedger((state) => state.project.editedAt ?? 0);
  return (
    <div className="shrink-0 border-b border-line bg-paper">
      <p className="mx-auto w-full max-w-5xl px-4 py-3 text-sm text-muted">
        {editedAt > 0 ? "Saved on this phone." : "What you type stays on this phone. No sign-in."}
      </p>
    </div>
  );
}
