'use client';

import { cn } from '@/lib/utils/cn';
import { cardSurface } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { Rating } from '@/components/ui/rating';
import { formatDate } from '@/lib/utils/format';
import { useApi } from '@/lib/api/use-api';
import type { Review, ReviewSummary } from '@/lib/types';

export function ReviewList({ designerId }: { designerId: string }) {
  const { data, error, loading } = useApi<{
    items: Review[];
    summary: ReviewSummary;
  }>(`/designers/${designerId}/reviews`);

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

  return (
    <div>
      <Rating
        value={data.summary.averageRating}
        count={data.summary.count}
        className="mb-8"
      />

      <ul className="flex flex-col gap-4">
        {data.items.map((review) => (
          <li
            key={review.id}
            className={cn(cardSurface, 'p-6')}
          >
            <div className="flex items-center gap-4">
              <Avatar
                name={review.reviewer?.name ?? 'Client'}
                src={review.reviewer?.avatarUrl}
                size={44}
              />
              <div>
                <p className="font-semibold">
                  {review.reviewer?.name ?? 'Client'}
                </p>
                <p className="text-sm text-muted">
                  {formatDate(review.createdAt)}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <Rating value={review.rating} />
            </div>

            {review.comment ? (
              <p className="mt-4 whitespace-pre-line text-muted">
                {review.comment}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
