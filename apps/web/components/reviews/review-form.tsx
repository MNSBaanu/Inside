'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, Textarea } from '@/components/ui/field';
import { ErrorNotice } from '@/components/ui/feedback';
import { RatingInput } from '@/components/ui/rating';
import { api, errorMessage } from '@/lib/api';

export function ReviewForm({
  projectId,
  onSubmitted,
}: {
  projectId: string;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (rating < 1) {
      setError('Choose a rating from one to five stars.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/projects/${projectId}/reviews`, {
        rating,
        comment: comment || undefined,
      });
      onSubmitted();
    } catch (cause) {
      setError(errorMessage(cause));
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Leave a review"
        description="Your rating appears on the designer's public profile once an admin approves it."
      />

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        {error ? <ErrorNotice message={error} /> : null}

        <div>
          <p className="label mb-3 text-ink/70">Rating</p>
          <RatingInput value={rating} onChange={setRating} />
        </div>

        <Field label="Comment" htmlFor="comment" hint="Optional.">
          <Textarea
            id="comment"
            maxLength={2000}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="How was it to work together?"
          />
        </Field>

        <div>
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? 'Publishing…' : 'Publish review'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
