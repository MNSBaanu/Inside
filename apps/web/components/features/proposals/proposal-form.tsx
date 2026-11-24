'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { ErrorNotice } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api/client';
import { formatMoney, titleCase } from '@/lib/utils/format';
import type { StageName } from '@/lib/types';

const billableStages: { name: StageName; hint: string; example: string }[] = [
  { name: 'CONCEPT', hint: 'First ideas, direction and layout options', example: '60000' },
  { name: 'DESIGN', hint: 'Detailed plans, 3D renders and materials', example: '150000' },
  { name: 'REVISION', hint: "Changes after the client's feedback", example: '40000' },
  { name: 'COMPLETION', hint: 'Final drawings, files and handover', example: '50000' },
];

export function ProposalForm({
  requestId,
  clientBudget,
  onSubmitted,
}: {
  requestId: string;
  clientBudget?: number | null;
  onSubmitted: () => void;
}) {
  const [scope, setScope] = useState('');
  const [timeline, setTimeline] = useState('');
  const [fees, setFees] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const total = billableStages.reduce(
    (sum, stage) => sum + (Number(fees[stage.name]) || 0),
    0,
  );
  const overBudget =
    clientBudget !== null && clientBudget !== undefined ? total - clientBudget : null;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const stageFees = billableStages
      .filter((stage) => Number(fees[stage.name]) > 0)
      .map((stage) => ({ name: stage.name, fee: Number(fees[stage.name]) }));

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
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
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
        <legend className="ui-label mb-3 text-ink/70">Stage fees</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {billableStages.map((stage) => (
            <Field
              key={stage.name}
              label={titleCase(stage.name)}
              htmlFor={`fee-${stage.name}`}
              hint={stage.hint}
            >
              <div className="relative">
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted"
                >
                  LKR
                </span>
                <Input
                  id={`fee-${stage.name}`}
                  type="number"
                  min={0}
                  step={1000}
                  value={fees[stage.name] ?? ''}
                  onChange={(event) =>
                    setFees({ ...fees, [stage.name]: event.target.value })
                  }
                  placeholder={stage.example}
                  aria-label={`${titleCase(stage.name)} fee in LKR`}
                  className="pl-14"
                />
              </div>
            </Field>
          ))}
        </div>

        <div className="mt-4 grid gap-3 rounded-lg bg-sand/60 p-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted">Your total</p>
            <p className="mt-0.5 text-xl font-semibold text-brand">{formatMoney(total)}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Client budget</p>
            <p className="mt-0.5 text-xl font-semibold">
              {clientBudget !== null && clientBudget !== undefined
                ? formatMoney(clientBudget)
                : 'Not set'}
            </p>
            {overBudget !== null && total > 0 ? (
              <p
                className={`mt-1 text-sm font-medium ${overBudget > 0 ? 'text-warning' : 'text-success'}`}
              >
                {overBudget > 0
                  ? `${formatMoney(overBudget)} over the client's budget`
                  : 'Within the client’s budget'}
              </p>
            ) : null}
          </div>
        </div>
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send proposal'}
        </Button>
      </div>
    </form>
  );
}
