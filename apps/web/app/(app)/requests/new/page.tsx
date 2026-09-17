'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/field';
import { ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { ProjectRequest } from '@/lib/types';

function NewRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const designerId = searchParams.get('designerId') ?? undefined;
  const briefId = searchParams.get('briefId') ?? undefined;

  const [type, setType] = useState<'DIRECT' | 'OPEN'>(
    designerId ? 'DIRECT' : 'OPEN',
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (type === 'DIRECT' && !designerId) {
      setError(
        'Pick a designer from their profile to send a direct request, or switch to an open request.',
      );
      return;
    }

    setSubmitting(true);
    try {
      const data = await api.post<{ request: ProjectRequest }>('/requests', {
        title,
        description: description || undefined,
        type,
        ...(type === 'DIRECT' ? { designerId } : {}),
        ...(briefId ? { briefId } : {}),
        ...(budget ? { budget: Number(budget) } : {}),
      });
      router.push(`/requests/${data.request.id}`);
    } catch (cause) {
      setError(errorMessage(cause));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      {error ? <ErrorNotice message={error} /> : null}

      <fieldset>
        <legend className="label mb-4 text-ink/70">Request type</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setType('DIRECT')}
            aria-pressed={type === 'DIRECT'}
            disabled={!designerId}
            className={cn(
              'rounded-card border p-5 text-left transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50',
              type === 'DIRECT'
                ? 'border-clay bg-clay-soft'
                : 'border-hairline bg-surface hover:border-ink/30',
            )}
          >
            <span className="block font-display text-lg font-semibold">
              Direct
            </span>
            <span className="mt-1 block text-sm text-muted">
              {designerId
                ? 'Send straight to the designer you picked.'
                : 'Open a designer profile first to send directly.'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setType('OPEN')}
            aria-pressed={type === 'OPEN'}
            className={cn(
              'rounded-card border p-5 text-left transition-colors duration-300',
              type === 'OPEN'
                ? 'border-clay bg-clay-soft'
                : 'border-hairline bg-surface hover:border-ink/30',
            )}
          >
            <span className="block font-display text-lg font-semibold">
              Open
            </span>
            <span className="mt-1 block text-sm text-muted">
              Any verified designer can send a proposal.
            </span>
          </button>
        </div>
      </fieldset>

      <Field label="Title" htmlFor="title">
        <Input
          id="title"
          required
          minLength={2}
          maxLength={200}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Living room refresh"
        />
      </Field>

      <Field label="Description" htmlFor="description">
        <Textarea
          id="description"
          maxLength={4000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What you need done, and anything a designer should know up front."
        />
      </Field>

      <Field label="Budget" htmlFor="budget" hint="Optional, in LKR.">
        <Input
          id="budget"
          type="number"
          min={0}
          value={budget}
          onChange={(event) => setBudget(event.target.value)}
          placeholder="500000"
        />
      </Field>

      <div className="flex flex-wrap gap-4">
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send request'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.push('/requests')}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function NewRequestPage() {
  return (
    <div>
      <Badge tone="clay">New request</Badge>
      <h1 className="mt-6 font-display text-section font-semibold">
        Ask for proposals.
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        Send it to one designer, or open it up and compare what comes back.
      </p>

      <Card className="mt-12">
        <CardHeader title="Request details" />
        <Suspense fallback={<Skeleton className="h-64" />}>
          <NewRequestForm />
        </Suspense>
      </Card>
    </div>
  );
}
