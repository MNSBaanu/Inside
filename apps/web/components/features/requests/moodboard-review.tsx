'use client';

import { Check } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/field';
import { api, errorMessage } from '@/lib/api/client';
import type { MoodboardReview as Review } from '@/lib/types';

/**
 * The designer approves the client's moodboard, which locks it, or asks for
 * changes, which lets the client edit it again. The client sees where it stands.
 */
export function MoodboardReview({
  requestId,
  review,
  canReview,
  onReviewed,
}: {
  requestId: string;
  review: Review;
  canReview: boolean;
  onReviewed: () => void;
}) {
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-3">
        {review.status === 'APPROVED' ? (
          <Badge tone="brand">Moodboard approved</Badge>
        ) : review.status === 'CHANGES_REQUESTED' ? (
          <Badge tone="highlight">Changes requested</Badge>
        ) : (
          <Badge>Waiting for the designer to review</Badge>
        )}
        {canReview && !asking ? (
          <>
            {review.status !== 'APPROVED' ? (
              <Button size="sm" onClick={() => void send(true)} disabled={busy}>
                <Check aria-hidden className="h-4 w-4" />
                Approve moodboard
              </Button>
            ) : null}
            <Button size="sm" variant="outline" onClick={() => setAsking(true)} disabled={busy}>
              Request changes
            </Button>
          </>
        ) : null}
      </div>

      {review.status === 'CHANGES_REQUESTED' && review.note ? (
        <p className="mt-2 text-sm text-muted">
          <span className="font-semibold text-ink">Asked for:</span> {review.note}
        </p>
      ) : null}

      {asking ? (
        <div className="mt-3">
          <Textarea
            aria-label="What would you like changed?"
            rows={3}
            maxLength={500}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="What would you like changed? e.g. Add a few lighting ideas."
          />
          <div className="mt-2 flex gap-3">
            <Button
              size="sm"
              onClick={() => void send(false)}
              disabled={busy || note.trim().length === 0}
            >
              Send request
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAsking(false)} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
    </div>
  );
}
