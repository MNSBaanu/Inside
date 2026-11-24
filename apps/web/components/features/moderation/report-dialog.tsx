'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useSession } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { ErrorNotice } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api/client';
import type { ReportTargetType } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

export function ReportDialog({
  targetType,
  targetId,
  reportedUserId,
  menuItem = false,
}: {
  targetType: ReportTargetType;
  targetId: string;
  reportedUserId?: string;
  menuItem?: boolean;
}) {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

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
      setOpen(false);
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
      <p className={cn('text-sm text-muted', menuItem && 'px-4 py-2.5')}>
        Reported. An admin will review this.
      </p>
    );
  }

  return (
    <>
      <button
        type="button"
        role={menuItem ? 'menuitem' : undefined}
        onClick={() => setOpen(true)}
        className={
          menuItem
            ? 'block w-full rounded-card px-4 py-2.5 text-left text-sm text-ink transition-colors duration-150 hover:bg-brand-soft hover:text-brand'
            : 'text-sm text-muted underline underline-offset-4 transition-colors duration-300 hover:text-brand'
        }
      >
        Report
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`report-title-${targetId}`}
            className="relative w-full max-w-md rounded-card bg-white p-6 shadow-lift"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close report"
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-sand"
            >
              <X aria-hidden className="h-5 w-5" />
            </button>

            <h2
              id={`report-title-${targetId}`}
              className="font-display text-xl font-semibold"
            >
              Report
            </h2>
            <p className="mt-1 text-sm text-muted">
              An admin reviews every report.
            </p>

            <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
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
                  autoFocus
                />
              </Field>

              <Field
                label="Details"
                htmlFor={`details-${targetId}`}
                hint="Optional."
              >
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
          </div>
        </div>
      ) : null}
    </>
  );
}
