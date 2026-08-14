'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { StarRating } from '@/components/reviews/star-rating';
import { formatApiError } from '@/lib/api/auth';
import { listAdminReviews, setReviewVisibility } from '@/lib/api/admin';

type AdminReview = Awaited<
  ReturnType<typeof listAdminReviews>
>['items'][number];

export function ReviewsModeration() {
  const [items, setItems] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listAdminReviews();
        if (!cancelled) setItems(data.items);
      } catch (err) {
        if (!cancelled) setError(formatApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onToggle(id: string, isVisible: boolean) {
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      const data = await setReviewVisibility(id, isVisible);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, isVisible: data.review.isVisible }
            : item,
        ),
      );
      setMessage(
        isVisible ? 'Review is visible again.' : 'Review hidden from public.',
      );
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin · Safety"
        title="Reviews"
        description="Hide or restore client reviews that violate guidelines."
      />

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading reviews…</p>
      ) : null}

      {!loading && items.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          description="Reviews appear here after clients rate completed projects."
        />
      ) : null}

      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.id} className="surface-panel space-y-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="font-heading text-xl tracking-tight">
                  {item.reviewer?.name ?? 'Client'} →{' '}
                  {item.designer?.name ?? 'Designer'}
                </p>
                <StarRating value={item.rating} size="sm" />
                <p className="text-xs text-muted-foreground">
                  {item.isVisible ? 'Visible' : 'Hidden'} ·{' '}
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant={item.isVisible ? 'outline' : 'default'}
                disabled={busyId === item.id}
                onClick={() => onToggle(item.id, !item.isVisible)}
              >
                {item.isVisible ? 'Hide' : 'Show'}
              </Button>
            </div>
            {item.comment ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.comment}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
