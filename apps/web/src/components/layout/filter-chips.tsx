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
                'rounded-full border px-3 py-1.5 text-sm transition-colors',
                active
                  ? 'border-transparent bg-primary text-primary-foreground'
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
