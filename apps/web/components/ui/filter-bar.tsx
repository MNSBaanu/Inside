import type { FormEventHandler, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export function FilterBar({
  onSubmit,
  action,
  className,
  children,
}: {
  onSubmit?: FormEventHandler<HTMLFormElement>;
  action?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <form
      onSubmit={onSubmit}
      action={action}
      className={cn(
        'flex flex-col rounded-card border border-hairline bg-surface p-2 shadow-card lg:flex-row lg:items-stretch lg:rounded-pill',
        className,
      )}
    >
      {children}
    </form>
  );
}

export function FilterField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'relative flex min-w-0 flex-1 flex-col justify-center gap-0.5 border-b border-hairline px-5 py-3 transition-colors duration-200',
        'last:border-b-0 focus-within:bg-sand/70 hover:bg-sand/40',
        'lg:rounded-pill lg:border-b-0 lg:px-6',
        'lg:after:absolute lg:after:right-0 lg:after:top-1/2 lg:after:h-8 lg:after:w-px lg:after:-translate-y-1/2 lg:after:bg-hairline lg:focus-within:after:opacity-0 lg:last:after:hidden',
      )}
    >
      <label
        htmlFor={htmlFor}
        className="text-label font-semibold uppercase text-muted"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export function FilterAction({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center justify-end gap-2 whitespace-nowrap px-5 py-3 lg:pl-4 lg:pr-2">
      {children}
    </div>
  );
}
