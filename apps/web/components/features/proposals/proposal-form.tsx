'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { ErrorNotice } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api/client';
import { formatMoney, titleCase } from '@/lib/utils/format';
import type { StageName } from '@/lib/types';

const billableStages: StageName[] = [
  'CONCEPT',
  'DESIGN',
  'REVISION',
  'COMPLETION',
];

export function ProposalForm({
  requestId,
  onSubmitted,
}: {
  requestId: string;
  onSubmitted: () => void;
}) {
  const [scope, setScope] = useState('');
  const [timeline, setTimeline] = useState('');
  const [fees, setFees] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const total = billableStages.reduce(
    (sum, stage) => sum + (Number(fees[stage]) || 0),
    0,
  );

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const stageFees = billableStages
      .filter((stage) => Number(fees[stage]) > 0)
      .map((stage) => ({ name: stage, fee: Number(fees[stage]) }));

    if (stageFees.length === 0) {
      setError('Set a fee for at least one stage.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/requests/${requestId}/proposals`, {
        scope,
        timeline,
        stageFees,
      });
      setScope('');
      setTimeline('');
      setFees({});
      onSubmitted();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      {error ? <ErrorNotice message={error} /> : null}

      <Field label="Scope" htmlFor="scope">
        <Textarea
          id="scope"
          required
          minLength={2}
          maxLength={4000}
          value={scope}
          onChange={(event) => setScope(event.target.value)}
          placeholder="What you will deliver, and what is not included."
        />
      </Field>

      <Field label="Timeline" htmlFor="timeline">
        <Input
          id="timeline"
          required
          minLength={2}
          maxLength={200}
          value={timeline}
          onChange={(event) => setTimeline(event.target.value)}
          placeholder="6 weeks"
        />
      </Field>

      <fieldset>
        <legend className="ui-label mb-4 text-ink/70">Stage fees</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {billableStages.map((stage) => (
            <Field
              key={stage}
              label={titleCase(stage)}
              htmlFor={`fee-${stage}`}
            >
              <Input
                id={`fee-${stage}`}
                type="number"
                min={0}
                value={fees[stage] ?? ''}
                onChange={(event) =>
                  setFees({ ...fees, [stage]: event.target.value })
                }
                placeholder="0"
              />
            </Field>
          ))}
        </div>
        <p className="mt-4 text-muted">
          Total:{' '}
          <span className="font-display text-xl font-semibold text-brand">
            {formatMoney(total)}
          </span>
        </p>
      </fieldset>

      <div>
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send proposal'}
        </Button>
      </div>
    </form>
  );
}
