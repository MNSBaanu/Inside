'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/field';
import { ErrorNotice } from '@/components/ui/feedback';
import { TagInput } from '@/components/ui/tag-input';
import { api, errorMessage } from '@/lib/api';
import type { Brief } from '@/lib/types';

const styleSuggestions = [
  'Scandinavian',
  'Minimalist',
  'Tropical Modern',
  'Mid-century',
  'Industrial',
  'Coastal',
];

const roomSuggestions = [
  'Living Room',
  'Kitchen',
  'Bedroom',
  'Bathroom',
  'Home Office',
  'Dining Room',
];

export default function NewBriefPage() {
  const router = useRouter();

  const [styles, setStyles] = useState<string[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (rooms.length === 0) {
      setError('Add at least one room so designers know what to quote for.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await api.post<{ brief: Brief }>('/briefs', {
        styles,
        rooms,
        budgetRange: budgetRange || undefined,
        description: description || undefined,
      });
      router.push(`/briefs/${data.brief.id}`);
    } catch (cause) {
      setError(errorMessage(cause));
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Badge tone="brand">New brief</Badge>
      <h1 className="mt-6 font-display text-section font-semibold">
        Tell us about the space.
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        The more specific you are, the closer the proposals will be to what you
        actually want.
      </p>

      <Card className="mt-12">
        <CardHeader
          title="Brief details"
          description="You can edit any of this later."
        />

        <form onSubmit={onSubmit} className="flex flex-col gap-8">
          {error ? <ErrorNotice message={error} /> : null}

          <Field
            label="Rooms"
            htmlFor="rooms"
            hint="Press Enter to add. At least one is required."
          >
            <TagInput
              id="rooms"
              values={rooms}
              onChange={setRooms}
              placeholder="Living Room"
              suggestions={roomSuggestions}
            />
          </Field>

          <Field
            label="Styles"
            htmlFor="styles"
            hint="Optional, but it sharpens the match."
          >
            <TagInput
              id="styles"
              values={styles}
              onChange={setStyles}
              placeholder="Scandinavian"
              suggestions={styleSuggestions}
            />
          </Field>

          <Field
            label="Budget range"
            htmlFor="budgetRange"
            hint="Free text, e.g. 400000-800000."
          >
            <Input
              id="budgetRange"
              maxLength={80}
              value={budgetRange}
              onChange={(event) => setBudgetRange(event.target.value)}
              placeholder="400000-800000"
            />
          </Field>

          <Field
            label="Description"
            htmlFor="description"
            hint="What you want, what you dislike, and anything fixed."
          >
            <Textarea
              id="description"
              maxLength={4000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="We want the living room to feel calmer. Keeping the existing sofa and the teak cabinet."
            />
          </Field>

          <div className="flex flex-wrap gap-4">
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create brief'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.push('/briefs')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
