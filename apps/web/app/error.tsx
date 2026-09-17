'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="shell flex min-h-[70vh] flex-col justify-center py-40">
      <p className="label">Something went wrong</p>
      <h1 className="mt-8 max-w-2xl font-display text-4xl leading-tight tracking-tight md:text-5xl">
        We could not load this page.
      </h1>
      <p className="mt-6 max-w-md text-base text-muted">
        The problem has been logged. Try again, and if it keeps happening the
        page may be temporarily unavailable.
      </p>
      <div className="mt-10">
        <button
          type="button"
          onClick={reset}
          className="label bg-ink px-7 py-4 text-canvas transition-opacity duration-300 hover:opacity-85"
        >
          Try again
        </button>
      </div>
      {error.digest ? (
        <p className="mt-10 text-sm text-muted">Reference: {error.digest}</p>
      ) : null}
    </div>
  );
}
