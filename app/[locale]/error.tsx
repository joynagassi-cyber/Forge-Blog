"use client";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center space-y-4">
      <div className="text-4xl" aria-hidden>
        ⚠️
      </div>
      <h1 className="font-serif text-2xl text-[var(--text-primary)]">
        Something went wrong
      </h1>
      <p className="text-sm text-[var(--text-secondary)]">
        An unexpected error occurred while loading this page.
        {error.digest && (
          <span className="block mt-1 text-xs text-[var(--text-muted)]">
            Error ID: {error.digest}
          </span>
        )}
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-[var(--accent)] text-white font-semibold px-4 py-2.5 text-sm hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
      >
        Try again
      </button>
    </div>
  );
}
