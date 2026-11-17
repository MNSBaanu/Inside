'use client';

import { Star as StarIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

function Star({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <StarIcon
      aria-hidden
      className={cn('h-5 w-5', className)}
      fill={filled ? 'currentColor' : 'none'}
      strokeWidth={1.5}
    />
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
  const halves = Math.round((value ?? 0) * 2) / 2;

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="flex text-highlight" aria-hidden>
        {[1, 2, 3, 4, 5].map((star) =>
          star - 0.5 === halves ? (
            <span key={star} className="relative inline-flex">
              <Star filled={false} />
              <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                <Star filled />
              </span>
            </span>
          ) : (
            <Star key={star} filled={star <= halves} />
          ),
        )}
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
