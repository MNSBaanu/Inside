'use client';

import { cn } from '@/lib/utils';

type FilterChipsProps = {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function FilterChips({
  label,
  options,
  value,
  onChange,
  className,
}: FilterChipsProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((option) => {
          const active = option === value;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? '' : option)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm outline-none transition-all focus-visible:ring-3 focus-visible:ring-ring/40',
                active
                  ? 'border-transparent bg-primary text-primary-foreground shadow-[0_8px_20px_-12px_oklch(0.35_0.06_150_/_0.8)]'
                  : 'border-border/60 bg-background/50 text-muted-foreground backdrop-blur-sm hover:border-primary/40 hover:text-foreground',
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
