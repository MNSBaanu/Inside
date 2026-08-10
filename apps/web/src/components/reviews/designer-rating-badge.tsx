'use client';

import { useEffect, useState } from 'react';
import { formatRating } from '@/components/reviews/star-rating';
import { listDesignerReviews } from '@/lib/api/reviews';
import type { ReviewSummary } from '@/lib/api/types';
import { cn } from '@/lib/utils';

const cache = new Map<string, ReviewSummary>();

export function DesignerRatingBadge({
  designerId,
  className,
}: {
  designerId: string;
  className?: string;
}) {
  const [summary, setSummary] = useState<ReviewSummary | null>(
    () => cache.get(designerId) ?? null,
  );

  useEffect(() => {
    let cancelled = false;
    const cached = cache.get(designerId);
    if (cached) {
      setSummary(cached);
      return;
    }
    (async () => {
      try {
        const data = await listDesignerReviews(designerId);
        if (cancelled) return;
        cache.set(designerId, data.summary);
        setSummary(data.summary);
      } catch {
        if (!cancelled) setSummary({ count: 0, averageRating: 0 });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [designerId]);

  if (!summary || summary.count === 0) return null;

  return (
    <span className={cn('tabular-nums', className)}>
      ★ {formatRating(summary.averageRating, summary.count)}
    </span>
  );
}
