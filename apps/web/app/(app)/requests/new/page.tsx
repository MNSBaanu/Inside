'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/field';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { useSession } from '@/components/providers/session-provider';
import { api, errorMessage } from '@/lib/api/client';
import { useApi } from '@/lib/api/use-api';
import { cn } from '@/lib/utils/cn';
import type { ProjectRequest } from '@/lib/types';

function NewRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const designerId = searchParams.get('designerId') ?? undefined;
  const briefId = searchParams.get('briefId') ?? undefined;
  const { data: picked } = useApi<{ designer: { name: string } }>(
    designerId ? `/designers/${designerId}` : null,
  );

  const [type, setType] = useState<'DIRECT' | 'OPEN'>(
    designerId ? 'DIRECT' : 'OPEN',
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
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
        ...(timeline ? { timeline } : {}),
      });
      router.replace(`/requests/${data.request.id}`);
    } catch (cause) {
      setError(errorMessage(cause));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {error ? <ErrorNotice message={error} /> : null}

      <fieldset>
        <legend className="ui-label mb-3 text-ink/70">Request type</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setType('DIRECT')}
            aria-pressed={type === 'DIRECT'}
            disabled={!designerId}
            className={cn(
              'rounded-card border p-4 text-left transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50',
              type === 'DIRECT'
                ? 'border-brand bg-brand-soft'
                : 'border-hairline bg-surface hover:border-ink/30',
            )}
          >
            <span className="block font-display text-lg font-semibold">
              Direct
            </span>
            <span className="mt-1 block text-sm text-muted">
              {designerId
                ? `Send straight to ${picked?.designer.name ?? 'the designer you picked'}.`
                : 'Open a designer profile first to send directly.'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setType('OPEN')}
            aria-pressed={type === 'OPEN'}
            className={cn(
              'rounded-card border p-4 text-left transition-colors duration-300',
              type === 'OPEN'
                ? 'border-brand bg-brand-soft'
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

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Expected timeline"
          htmlFor="timeline"
          hint="Optional, for example 6 weeks."
        >
          <Input
            id="timeline"
            maxLength={200}
            value={timeline}
            onChange={(event) => setTimeline(event.target.value)}
            placeholder="6 weeks"
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
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send request'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/requests')}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function NewRequestPage() {
  const { user } = useSession();
  if (user && user.activeRole !== 'CLIENT') {
    return (
      <EmptyState
        title="Requests are sent by clients."
        description={
          user.role === 'DESIGNER'
            ? 'Switch to your client view to request a designer.'
            : 'Sign in with a client account to send a request.'
        }
      />
    );
  }

  return (
    <div>
      <Link
        href="/requests"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand"
      >
        <ChevronLeft aria-hidden className="h-4 w-4" />
        All requests
      </Link>
      <PageHeader
        variant="app"
        eyebrow="New request"
        title="Ask for proposals."
        description="Send it to one designer, or open it up and compare what comes back."
      />

      <Card className="mt-6">
        <CardHeader title="Request details" />
        <Suspense fallback={<Skeleton className="h-64" />}>
          <NewRequestForm />
        </Suspense>
      </Card>
    </div>
  );
}
