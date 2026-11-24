'use client';

import { Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/field';
import { MoodboardPreview } from '@/components/features/moodboards/moodboard-preview';
import { api, errorMessage } from '@/lib/api/client';
import { cn } from '@/lib/utils/cn';
import type { MoodboardReview as Review, MoodboardSummary } from '@/lib/types';

const STATUS = {
  APPROVED: { label: 'Approved', tone: 'bg-brand-soft text-brand-deep', dot: 'bg-brand' },
  CHANGES_REQUESTED: {
    label: 'Changes requested',
    tone: 'bg-highlight/15 text-ink',
    dot: 'bg-highlight',
  },
  OPEN: { label: 'Not reviewed yet', tone: 'bg-sand text-ink/70', dot: 'bg-muted' },
};

/**
 * The request's moodboard with its review. The designer approves it, which
 * locks it, or asks for changes, which lets the client edit it again. The
 * client sees where it stands.
 */
export function MoodboardReview({
  board,
  clientName,
  requestId,
  review,
  canReview,
  onReviewed,
}: {
  board: MoodboardSummary;
  clientName?: string;
  requestId: string;
  review: Review;
  canReview: boolean;
  onReviewed: () => void;
}) {
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const status = STATUS[review.status];

  async function send(approve: boolean) {
    setError(null);
    setBusy(true);
    try {
      await api.patch(`/requests/${requestId}/moodboard-review`, {
        approve,
        ...(approve ? {} : { note }),
      });
      setAsking(false);
      setNote('');
      onReviewed();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <MoodboardPreview
      board={board}
      clientName={clientName}
      status={
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-xs font-medium',
            status.tone,
          )}
        >
          <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
          {status.label}
        </span>
      }
      actions={
        canReview && !asking ? (
          <>
            <Button size="sm" variant="outline" onClick={() => setAsking(true)} disabled={busy}>
              Request changes
            </Button>
            {review.status !== 'APPROVED' ? (
              <Button size="sm" onClick={() => void send(true)} disabled={busy}>
                <Check aria-hidden className="h-4 w-4" />
                Approve
              </Button>
            ) : null}
          </>
        ) : null
      }
    >
      {review.status === 'CHANGES_REQUESTED' && review.note ? (
        <p className="mt-3 rounded-lg bg-sand/60 px-4 py-3 text-sm">
          <span className="font-semibold">Asked for:</span> {review.note}
        </p>
      ) : null}

      {asking ? (
        <div className="mt-4 rounded-lg border border-hairline p-4">
          <Textarea
            aria-label="What would you like changed?"
            rows={3}
            maxLength={500}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="What would you like changed? e.g. Add a few lighting ideas."
          />
          <div className="mt-3 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setAsking(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => void send(false)}
              disabled={busy || note.trim().length === 0}
            >
              Send request
            </Button>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
    </MoodboardPreview>
  );
}
