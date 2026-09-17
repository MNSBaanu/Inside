'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="shell flex min-h-[70vh] flex-col justify-center py-40">
      <Badge tone="clay" className="w-fit">
        Something went wrong
      </Badge>
      <h1 className="mt-8 max-w-2xl font-display text-section font-semibold">
        We could not load this page.
      </h1>
      <p className="mt-6 max-w-md text-lg text-muted">
        The problem has been logged. Try again, and if it keeps happening the
        page may be temporarily unavailable.
      </p>
      <div className="mt-10">
        <Button type="button" onClick={reset} size="lg">
          Try again
        </Button>
      </div>
      {error.digest ? (
        <p className="mt-10 text-sm text-muted">Reference: {error.digest}</p>
      ) : null}
    </div>
  );
}
