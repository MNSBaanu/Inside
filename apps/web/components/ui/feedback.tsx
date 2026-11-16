import { Inbox, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-card border border-dashed border-hairline bg-sand/40 px-8 py-14 text-center">
      <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-canvas text-brand shadow-card">
        <Icon aria-hidden className="h-6 w-6" />
      </span>
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
