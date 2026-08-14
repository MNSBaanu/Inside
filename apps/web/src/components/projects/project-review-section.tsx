'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InlineAlert } from '@/components/layout/inline-alert';
import { Skeleton } from '@/components/layout/skeleton';
import { ModeSwitchNotice } from '@/components/projects/mode-switch-notice';
import { StarRating } from '@/components/reviews/star-rating';
import { formatApiError } from '@/lib/api/auth';
import { createReview, listDesignerReviews } from '@/lib/api/reviews';
import type { AuthUser, Review } from '@/lib/api/types';

export function ProjectReviewSection({
  projectId,
  designerId,
  designerName,
  me,
  onUserRefresh,
}: {
  projectId: string;
  designerId: string;
  designerName: string;
  me: AuthUser;
  onUserRefresh: () => Promise<void>;
}) {
  const [existing, setExisting] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wrongMode = me.activeRole !== 'CLIENT';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await listDesignerReviews(designerId);
        if (cancelled) return;
        const mine = data.items.find(
          (item) => item.projectId === projectId && item.reviewerId === me.id,
        );
        setExisting(mine ?? null);
      } catch (err) {
        if (!cancelled) setError(formatApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [designerId, me.id, projectId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash !== '#review') return;
    document.getElementById('review')?.scrollIntoView({ behavior: 'smooth' });
  }, [loading]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const data = await createReview(projectId, {
        rating,
        comment: comment.trim() || undefined,
      });
      setExisting(data.review);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="review" className="surface-panel scroll-mt-28 space-y-4 p-6">
      <div>
        <h2 className="font-heading text-2xl tracking-tight">Review</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          How was working with {designerName}?
        </p>
      </div>

      {wrongMode ? (
        <ModeSwitchNotice need="CLIENT" onSwitched={onUserRefresh} />
      ) : null}

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : null}

      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}

      {!loading && existing ? (
        <div className="space-y-2 rounded-xl border border-border/60 bg-muted/25 p-4">
          <StarRating value={existing.rating} />
          {existing.comment ? (
            <p className="text-sm leading-relaxed">{existing.comment}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No written comment.</p>
          )}
          <p className="text-xs text-muted-foreground">
            Submitted {new Date(existing.createdAt).toLocaleDateString()}
          </p>
        </div>
      ) : null}

      {!loading && !existing && !wrongMode ? (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-comment">Comment (optional)</Label>
            <Textarea
              id="review-comment"
              rows={3}
              maxLength={2000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What went well, and what would you hire them for again?"
            />
          </div>
          <Button type="submit" disabled={saving || rating < 1}>
            {saving ? 'Submitting…' : 'Submit review'}
          </Button>
        </form>
      ) : null}
    </section>
  );
}
