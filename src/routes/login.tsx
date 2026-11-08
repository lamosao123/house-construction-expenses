import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-4 text-ink">
      <div className="w-full max-w-sm rounded-lg border border-line bg-paper p-6">
        <p className="text-xs font-medium tracking-widest text-brass uppercase">House cost book</p>
        <h1 className="mt-2 font-display text-3xl">No sign-in needed</h1>
        <p className="mt-2 text-sm text-muted">
          Your numbers stay on this phone. You can keep entering them, and Excel is the backup.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-ink px-4 text-sm font-medium text-paper"
        >
          Back to the book
        </Link>
      </div>
    </main>
  );
}
