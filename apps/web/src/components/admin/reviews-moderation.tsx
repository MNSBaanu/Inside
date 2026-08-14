'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/layout/empty-state';
import { InlineAlert } from '@/components/layout/inline-alert';
import { PageHeader } from '@/components/layout/page-header';
import { SkeletonList } from '@/components/layout/skeleton';
import { StarRating } from '@/components/reviews/star-rating';
import { formatApiError } from '@/lib/api/auth';
import { listAdminReviews, setReviewVisibility } from '@/lib/api/admin';
import { cn } from '@/lib/utils';

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
          item.id === id ? { ...item, isVisible: data.review.isVisible } : item,
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

  const hidden = items.filter((item) => !item.isVisible).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin · Safety"
        title="Reviews"
        description="Hide or restore client reviews that violate guidelines."
        actions={
          items.length > 0 ? (
            <span className="surface-panel px-3 py-1.5 text-sm text-muted-foreground">
              {items.length} total · {hidden} hidden
            </span>
          ) : null
        }
      />

      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
      {message ? <InlineAlert tone="success">{message}</InlineAlert> : null}

      {loading ? <SkeletonList rows={3} /> : null}

      {!loading && items.length === 0 ? (
        <EmptyState
          icon={<Star className="size-5" />}
          title="No reviews yet"
          description="Reviews appear here after clients rate completed projects."
        />
      ) : null}

      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item.id}
            className={cn(
              'surface-panel space-y-3 p-5 md:p-6',
              !item.isVisible && 'opacity-80 ring-1 ring-destructive/20',
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="font-heading text-xl tracking-tight">
                  {item.reviewer?.name ?? 'Client'}
                  <span className="mx-2 text-muted-foreground">→</span>
                  {item.designer?.name ?? 'Designer'}
                </p>
                <StarRating value={item.rating} size="sm" />
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  {item.isVisible ? (
                    <Eye aria-hidden="true" className="size-3.5" />
                  ) : (
                    <EyeOff aria-hidden="true" className="size-3.5" />
                  )}
                  {item.isVisible ? 'Visible to everyone' : 'Hidden from public'}
                  <span aria-hidden="true">·</span>
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
              <p className="rounded-xl border border-border/50 bg-muted/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                {item.comment}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
