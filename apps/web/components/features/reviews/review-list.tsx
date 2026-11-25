'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { cardSurface } from '@/components/ui/card';
import { ReportDialog } from '@/components/features/moderation/report-dialog';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { Rating } from '@/components/ui/rating';
import { formatDate } from '@/lib/utils/format';
import { api, errorMessage } from '@/lib/api/client';
import { buildQuery, useApi } from '@/lib/api/use-api';
import type { Review, ReviewSummary } from '@/lib/types';

const PAGE_SIZE = 5;

function reviewsPath(endpoint: string, page: number) {
  return `${endpoint}${buildQuery({ page, pageSize: PAGE_SIZE })}`;
}

/** `heading` and `hideWhenEmpty` let a page show the section only when it has reviews. */
export function ReviewList({
  endpoint,
  heading,
  hideWhenEmpty = false,
}: {
  endpoint: string;
  heading?: ReactNode;
  hideWhenEmpty?: boolean;
}) {
  const { data, error, loading } = useApi<{
    items: Review[];
    summary: ReviewSummary;
  }>(reviewsPath(endpoint, 1));
  const [more, setMore] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);

  async function loadMore() {
    setLoadingMore(true);
    setMoreError(null);
    try {
      const next = page + 1;
      const result = await api.get<{ items: Review[] }>(reviewsPath(endpoint, next));
      setMore((current) => [...current, ...result.items]);
      setPage(next);
    } catch (cause) {
      setMoreError(errorMessage(cause));
    } finally {
      setLoadingMore(false);
    }
  }

  if (hideWhenEmpty && (loading || error || !data?.items.length)) return null;
  if (loading) return <Skeleton className="h-40" />;
  if (error) return <ErrorNotice message={error} />;
  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        title="No reviews yet."
        description="Reviews appear here once a client completes a project with this designer."
      />
    );
  }

  const items = [
    ...data.items,
    ...more.filter((review) => !data.items.some((item) => item.id === review.id)),
  ];
  const hasMore = items.length < data.summary.count;

  return (
    <div>
      {heading}
      <Rating
        value={data.summary.averageRating}
        count={data.summary.count}
        className="mb-4"
      />

      <ul className="flex flex-col gap-3">
        {items.map((review) => (
          <li
            key={review.id}
            className={cn(cardSurface, 'p-5')}
          >
            <div className="flex items-center gap-4">
              <Avatar
                name={review.reviewer?.name ?? 'Client'}
                src={review.reviewer?.avatarUrl}
                size={44}
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {review.reviewer?.name ?? 'Client'}
                </p>
                <p className="text-sm text-muted">
                  {formatDate(review.createdAt)}
                </p>
              </div>
              <ReportDialog
                targetType="REVIEW"
                targetId={review.id}
                hideFor={review.reviewerId}
              />
            </div>

            <div className="mt-3">
              <Rating value={review.rating} />
            </div>

            {review.comment ? (
              <p className="mt-2 whitespace-pre-line text-sm text-muted">
                {review.comment}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      {moreError ? (
        <div className="mt-4">
          <ErrorNotice message={moreError} />
        </div>
      ) : null}
      {hasMore ? (
        <div className="mt-4 flex items-center gap-4">
          <Button variant="outline" onClick={() => void loadMore()} disabled={loadingMore}>
            {loadingMore ? 'Loading…' : 'Show more reviews'}
          </Button>
          <p className="text-sm text-muted">
            Showing {items.length} of {data.summary.count}
          </p>
        </div>
      ) : null}
    </div>
  );
}
