'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/layout/empty-state';
import { InlineAlert } from '@/components/layout/inline-alert';
import { PageHeader } from '@/components/layout/page-header';
import { SkeletonList } from '@/components/layout/skeleton';
import { StatusPill } from '@/components/layout/status-pill';
import { formatApiError } from '@/lib/api/auth';
import {
  approveVerification,
  listPendingVerifications,
  rejectVerification,
} from '@/lib/api/admin';
import type { Verification } from '@/lib/api/types';

export function VerificationQueue() {
  const [items, setItems] = useState<Verification[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listPendingVerifications();
        if (!cancelled) setItems(data.items);
      } catch (err) {
        if (!cancelled) setError(formatApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onDecide(id: string, decision: 'approve' | 'reject') {
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      if (decision === 'approve') {
        await approveVerification(id);
        setMessage('Verification approved — designer is now verified.');
      } else {
        await rejectVerification(id, notes[id]?.trim() || undefined);
        setMessage('Verification rejected.');
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin · Trust"
        title="Verification queue"
        description="Check the evidence a designer submitted, then approve or reject with a note."
      />

      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
      {message ? <InlineAlert tone="success">{message}</InlineAlert> : null}

      {loading ? <SkeletonList rows={2} /> : null}

      {!loading && items.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="size-5" />}
          title="Queue is clear"
          description="No designer is waiting on verification right now."
        />
      ) : null}

      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.id} className="surface-panel space-y-4 p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-xl tracking-tight">
                    {item.designer?.name ?? 'Designer'}
                  </h2>
                  <StatusPill value={item.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.designer?.email ?? item.designerId}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Submitted {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="space-y-1 text-sm">
              <a
                href={item.evidenceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
              >
                View submitted evidence
                <ExternalLink aria-hidden="true" className="size-3.5" />
              </a>
              {item.notes ? (
                <p className="text-muted-foreground">
                  Designer note: {item.notes}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row sm:items-center">
              <Input
                value={notes[item.id] ?? ''}
                onChange={(e) =>
                  setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                }
                placeholder="Rejection note (optional)"
                aria-label={`Rejection note for ${item.designer?.name ?? 'designer'}`}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={busyId === item.id}
                  onClick={() => onDecide(item.id, 'approve')}
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busyId === item.id}
                  onClick={() => onDecide(item.id, 'reject')}
                >
                  Reject
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
