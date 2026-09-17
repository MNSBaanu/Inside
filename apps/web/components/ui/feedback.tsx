import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-card border border-dashed border-hairline bg-sand/40 px-8 py-16 text-center">
      <h3 className="font-display text-2xl font-semibold">{title}</h3>
      {description ? (
        <p className="mx-auto mt-3 max-w-md text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-8">{action}</div> : null}
    </div>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-card bg-brand-soft px-4 py-3 text-sm text-brand-deep"
    >
      {message}
    </p>
  );
}

export function SuccessNotice({ message }: { message: string }) {
  return (
    <p
      role="status"
      className="rounded-card bg-support-soft px-4 py-3 text-sm text-success"
    >
      {message}
    </p>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-card bg-sand', className)} />
  );
}
