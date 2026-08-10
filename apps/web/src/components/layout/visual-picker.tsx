'use client';

import type { TaxonomyOption } from '@/lib/taxonomy';
import { cn } from '@/lib/utils';

type VisualPickerProps = {
  options: readonly TaxonomyOption[];
  selected: readonly string[];
  onToggle: (label: string) => void;
  className?: string;
};

export function VisualPicker({
  options,
  selected,
  onToggle,
  className,
}: VisualPickerProps) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-3', className)}>
      {options.map((option) => {
        const active = selected.includes(option.label);
        return (
          <button
            key={option.label}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(option.label)}
            className={cn(
              'group relative overflow-hidden rounded-2xl border text-left transition-all',
              active
                ? 'border-primary shadow-[0_0_0_3px_oklch(0.38_0.06_155_/_0.18)]'
                : 'border-border/60 hover:border-primary/40',
            )}
          >
            <div className="aspect-[4/3] overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={option.image}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-[linear-gradient(180deg,transparent,oklch(0.18_0.03_155_/_0.8))] p-3 pt-10">
              <span className="text-sm font-medium text-white">
                {option.label}
              </span>
              <span
                className={cn(
                  'grid size-5 shrink-0 place-items-center rounded-full border text-[11px] font-semibold',
                  active
                    ? 'border-transparent bg-white text-[oklch(0.24_0.03_155)]'
                    : 'border-white/60 text-transparent',
                )}
                aria-hidden="true"
              >
                ✓
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
