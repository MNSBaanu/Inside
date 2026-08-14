'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatApiError } from '@/lib/api/auth';
import { createReport } from '@/lib/api/reports';
import type { ReportTargetType } from '@/lib/api/types';

export function ReportUserForm({
  targetType,
  targetId,
  reportedUserId,
  targetLabel,
  onDone,
}: {
  targetType: ReportTargetType;
  targetId: string;
  reportedUserId?: string;
  targetLabel: string;
  onDone?: () => void;
}) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await createReport({
        targetType,
        targetId,
        reportedUserId,
        reason: reason.trim(),
        details: details.trim() || undefined,
      });
      setMessage('Report submitted. An admin will review it.');
      setReason('');
      setDetails('');
      setOpen(false);
      onDone?.();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <div className="space-y-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setOpen(true)}
        >
          Report {targetLabel}
        </Button>
        {message ? (
          <p className="text-xs text-muted-foreground" role="status">
            {message}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-xl border border-border/60 p-4"
    >
      <p className="text-sm font-medium">Report {targetLabel}</p>
      <div className="space-y-2">
        <Label htmlFor="report-reason">Reason</Label>
        <Input
          id="report-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          minLength={2}
          maxLength={500}
          placeholder="Harassment, spam, misleading work…"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="report-details">Details (optional)</Label>
        <textarea
          id="report-details"
          rows={3}
          maxLength={4000}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          placeholder="Anything an admin should know"
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? 'Sending…' : 'Submit report'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={saving}
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
