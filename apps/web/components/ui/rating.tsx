'use client';

import { Star as StarIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

function Star({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <StarIcon
      aria-hidden
      className={cn(
        'h-4 w-4 shrink-0',
        filled ? 'fill-highlight text-highlight' : 'fill-ink/10 text-transparent',
        className,
      )}
      strokeWidth={1.5}
      strokeLinejoin="round"
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
  const rated = value !== null && value !== 0;

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="flex gap-0.5" aria-hidden>
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
      {rated ? (
        <span className="text-sm">
          <span className="font-semibold text-ink">{value.toFixed(1)}</span>
          {count !== undefined ? <span className="text-muted"> ({count})</span> : null}
        </span>
      ) : (
        <span className="text-sm text-muted">No rating yet</span>
      )}
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
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onFocus={() => setHover(star)}
          onBlur={() => setHover(0)}
          aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
          aria-pressed={value === star}
          className="rounded-pill p-1 transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <Star filled={star <= shown} className="h-7 w-7" />
        </button>
      ))}
    </div>
  );
}
