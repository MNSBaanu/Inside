'use client';

import { SlidersHorizontal } from 'lucide-react';
import { Children, useState, type FormEventHandler, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export function FilterBar({
  onSubmit,
  action,
  compact = false,
  className,
  children,
}: {
  onSubmit?: FormEventHandler<HTMLFormElement>;
  action?: string;
  compact?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [first, ...rest] = Children.toArray(children);

  return (
    <form
      onSubmit={onSubmit}
      action={action}
      className={cn(
        'flex flex-col rounded-card border border-hairline bg-surface p-2 shadow-card lg:flex-row lg:items-stretch lg:rounded-pill',
        compact &&
          'lg:!p-1 [&_div:has(>label)]:!py-2 lg:[&_div:has(>label)]:!py-1.5',
        className,
      )}
    >
      {first}
      {rest.length > 0 ? (
        <>
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            className="flex items-center justify-between gap-2 px-5 py-3 text-sm font-semibold text-ink lg:hidden"
          >
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal aria-hidden className="h-4 w-4" />
              {open ? 'Hide filters' : 'More filters'}
            </span>
            <span aria-hidden className="text-muted">{rest.length}</span>
          </button>
          <div className={cn('flex-col border-t border-hairline lg:contents', open ? 'flex' : 'hidden')}>
            {rest}
          </div>
        </>
      ) : null}
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
        className="cursor-pointer text-label font-semibold uppercase text-muted before:absolute before:inset-0 before:content-['']"
      >
        {label}
      </label>
      <div className="relative">{children}</div>
    </div>
  );
}
