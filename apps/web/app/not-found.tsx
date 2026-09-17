import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="shell flex min-h-[70vh] flex-col justify-center py-40">
      <p className="label">404</p>
      <h1 className="mt-8 max-w-2xl font-display text-4xl leading-tight tracking-tight md:text-5xl">
        This page has not been built yet.
      </h1>
      <p className="mt-6 max-w-md text-base text-muted">
        The link works, but there is nothing behind it for now. Start from the
        home page instead.
      </p>
      <div className="mt-10">
        <Link
          href="/"
          className="label bg-ink px-7 py-4 text-canvas transition-opacity duration-300 hover:opacity-85"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
