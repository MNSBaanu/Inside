import { cn } from '@/lib/utils';

export function formatRating(average: number, count: number) {
  if (count === 0) return 'No reviews yet';
  return `${average.toFixed(1)} · ${count} ${count === 1 ? 'review' : 'reviews'}`;
}

export function StarRating({
  value,
  onChange,
  size = 'md',
  className,
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const interactive = typeof onChange === 'function';
  const starClass = size === 'sm' ? 'text-sm' : 'text-xl';

  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={interactive ? 'Rating' : `${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        if (!interactive) {
          return (
            <span
              key={star}
              aria-hidden="true"
              className={cn(
                starClass,
                filled ? 'text-[oklch(0.72_0.12_85)]' : 'text-muted-foreground/35',
              )}
            >
              ★
            </span>
          );
        }
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
            onClick={() => onChange(star)}
            className={cn(
              starClass,
              'rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              filled
                ? 'text-[oklch(0.72_0.12_85)]'
                : 'text-muted-foreground/35 hover:text-[oklch(0.72_0.12_85)]',
            )}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
