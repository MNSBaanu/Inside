'use client';

import { useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { ErrorNotice } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api';
import type { ReportTargetType } from '@/lib/types';

export function ReportDialog({
  targetType,
  targetId,
  reportedUserId,
}: {
  targetType: ReportTargetType;
  targetId: string;
  reportedUserId?: string;
}) {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  if (status !== 'authenticated') return null;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post('/reports', {
        targetType,
        targetId,
        reportedUserId,
        reason,
        details: details || undefined,
      });
      setSent(true);
      setReason('');
      setDetails('');
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <p className="text-sm text-muted">
        Reported. An admin will review this.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-muted underline underline-offset-4 transition-colors duration-300 hover:text-brand"
      >
        Report
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 flex flex-col gap-4 rounded-card border border-hairline bg-surface p-6"
    >
      {error ? <ErrorNotice message={error} /> : null}

      <Field label="Reason" htmlFor={`reason-${targetId}`}>
        <Input
          id={`reason-${targetId}`}
          required
          minLength={2}
          maxLength={500}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Why are you reporting this?"
        />
      </Field>

      <Field label="Details" htmlFor={`details-${targetId}`} hint="Optional.">
        <Textarea
          id={`details-${targetId}`}
          maxLength={4000}
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          className="min-h-20"
        />
      </Field>

      <div className="flex gap-3">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? 'Sending…' : 'Submit report'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
