'use client';

import { useEffect, useState } from 'react';
import {
  StarRating,
  formatRating,
} from '@/components/reviews/star-rating';
import { ReportUserForm } from '@/components/trust/report-user-form';
import { fetchMe, formatApiError } from '@/lib/api/auth';
import { listDesignerReviews } from '@/lib/api/reviews';
import type { Review, ReviewSummary } from '@/lib/api/types';

export function DesignerReviews({ designerId }: { designerId: string }) {
  const [items, setItems] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>({
    count: 0,
    averageRating: 0,
  });
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [data, me] = await Promise.all([
          listDesignerReviews(designerId),
          fetchMe().catch(() => null),
        ]);
        if (cancelled) return;
        setItems(data.items);
        setSummary(data.summary);
        setViewerId(me?.id ?? null);
      } catch (err) {
        if (!cancelled) setError(formatApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [designerId]);

  return (
    <section className="space-y-4 border-t border-border/60 pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-heading text-2xl tracking-tight">Client reviews</h2>
        {!loading ? (
          <p className="text-sm text-muted-foreground">
            {formatRating(summary.averageRating, summary.count)}
          </p>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading reviews…</p>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No public reviews yet for this designer.
        </p>
      ) : null}

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="surface-panel space-y-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">
                {item.reviewer?.name ?? 'Client'}
              </p>
              <span className="text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>
            <StarRating value={item.rating} size="sm" />
            {item.comment ? (
              <p className="text-sm leading-relaxed text-foreground/90">
                {item.comment}
              </p>
            ) : null}
            {viewerId && viewerId !== item.reviewerId ? (
              <ReportUserForm
                targetType="REVIEW"
                targetId={item.id}
                reportedUserId={item.reviewerId}
                targetLabel="this review"
              />
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
