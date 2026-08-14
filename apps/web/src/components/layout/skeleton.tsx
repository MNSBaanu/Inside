import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-lg bg-[linear-gradient(90deg,var(--muted),var(--secondary),var(--muted))]',
        className,
      )}
    />
  );
}

export function SkeletonList({
  rows = 3,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)} role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="surface-panel space-y-3 p-5">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
