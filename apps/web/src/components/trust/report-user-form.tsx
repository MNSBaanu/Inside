'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InlineAlert } from '@/components/layout/inline-alert';
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
          <Flag aria-hidden="true" className="size-3.5" />
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
      className="space-y-3 rounded-xl border border-border/60 bg-muted/25 p-4"
    >
      <p className="flex items-center gap-2 text-sm font-medium">
        <Flag aria-hidden="true" className="size-4 text-destructive" />
        Report {targetLabel}
      </p>
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
        <Textarea
          id="report-details"
          rows={3}
          maxLength={4000}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Anything an admin should know"
        />
      </div>
      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
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
