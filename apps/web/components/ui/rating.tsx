'use client';

import { cn } from '@/lib/utils/cn';

function Star({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden
      className={cn('h-5 w-5', className)}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
    >
      <path d="M10 1.8l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L2.2 7.5l5.4-.8L10 1.8z" />
    </svg>
  );
}

export function Rating({
  value,
  count,
  className,
}: {
  value: number | null;
  count?: number;
  className?: string;
}) {
  const rounded = Math.round(value ?? 0);

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="flex text-highlight" aria-hidden>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} filled={star <= rounded} />
        ))}
      </span>
      <span className="text-sm text-muted">
        {value === null || value === 0
          ? 'No rating yet'
          : `${value.toFixed(1)}${count !== undefined ? ` (${count})` : ''}`}
      </span>
    </span>
  );
}

export function RatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
          aria-pressed={value === star}
          className={cn(
            'rounded-pill p-1 transition-colors duration-200',
            star <= value ? 'text-highlight' : 'text-hairline hover:text-muted',
          )}
        >
          <Star filled={star <= value} className="h-7 w-7" />
        </button>
      ))}
    </div>
  );
}
