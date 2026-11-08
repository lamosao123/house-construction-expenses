import { createFileRoute, Link } from "@tanstack/react-router";
import { authEnabled, GROK_PROVIDERS, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-4 py-10 text-ink">
      <div className="w-full max-w-sm rounded-xl border border-line bg-paper p-6">
        <p className="text-xs font-medium tracking-widest text-brass uppercase">House cost book</p>
        <h1 className="mt-2 font-display text-3xl">Sign in to your house project</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Use the same account on your MacBook and iPhone to access one synchronized project book.
        </p>
        {authEnabled ? (
          <div className="mt-6 flex flex-col gap-2">
            {GROK_PROVIDERS.map((provider) => (
              <button
                key={provider.providerId}
                type="button"
                onClick={() => void signIn(provider.providerId, { callbackURL: "/" })}
                className="h-11 w-full cursor-pointer rounded-md bg-ink px-4 text-sm font-medium text-paper hover:opacity-90"
              >
                Continue with {provider.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm text-muted">Sign-in is not enabled yet.</p>
        )}
        <Link to="/" className="mt-6 inline-flex text-sm text-muted underline underline-offset-4">
          Back to the book
        </Link>
      </div>
    </main>
  );
}
