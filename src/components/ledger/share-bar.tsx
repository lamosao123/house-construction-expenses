import { UserButton } from "@/lib/auth/gates";
import { useLedger } from "@/lib/ledger/store";

export type SyncStatus = "connecting" | "syncing" | "saving" | "saved" | "offline" | "error";

const statusLabel: Record<SyncStatus, string> = {
  connecting: "Connecting to your cloud book…",
  syncing: "Checking for updates…",
  saving: "Saving to cloud…",
  saved: "All changes synced",
  offline: "Offline · changes saved on this device",
  error: "Sync issue · your local copy remains on this device",
};

export function ShareBar({ status }: { status: SyncStatus }) {
  const editedAt = useLedger((state) => state.project.editedAt ?? 0);
  return (
    <div className="shrink-0 border-b border-line bg-paper">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-2">
        <div className="min-w-0">
          <p className="text-sm text-muted">{statusLabel[status]}</p>
          {editedAt > 0 ? (
            <p className="text-xs text-muted">Last edited {new Date(editedAt).toLocaleString()}</p>
          ) : null}
        </div>
        <UserButton />
      </div>
    </div>
  );
}
