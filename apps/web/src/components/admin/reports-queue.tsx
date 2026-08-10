'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { StatusPill } from '@/components/layout/status-pill';
import { formatApiError } from '@/lib/api/auth';
import { dismissReport, listOpenReports, resolveReport } from '@/lib/api/admin';
import type { Report } from '@/lib/api/types';

export function ReportsQueue() {
  const [items, setItems] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listOpenReports();
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

  async function onDecide(id: string, decision: 'resolve' | 'dismiss') {
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      if (decision === 'resolve') {
        await resolveReport(id);
        setMessage('Report marked resolved.');
      } else {
        await dismissReport(id);
        setMessage('Report dismissed.');
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
        eyebrow="Admin · Safety"
        title="Reports"
        description="Open and under-review reports raised by clients and designers."
      />

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading reports…</p>
      ) : null}

      {!loading && items.length === 0 ? (
        <EmptyState
          title="Nothing to triage"
          description="There are no open or under-review reports."
        />
      ) : null}

      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.id} className="surface-panel space-y-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-heading text-xl tracking-tight">
                    {item.reason}
                  </h2>
                  <StatusPill value={item.status} />
                  <StatusPill value={item.targetType} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Reported by {item.reporter?.name ?? item.reporterId}
                  {item.reportedUser
                    ? ` · about ${item.reportedUser.name}`
                    : ''}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>

            {item.details ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.details}
              </p>
            ) : null}

            <p className="text-xs text-muted-foreground">
              Target id: <span className="font-mono">{item.targetId}</span>
            </p>

            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={busyId === item.id}
                onClick={() => onDecide(item.id, 'resolve')}
              >
                Resolve
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busyId === item.id}
                onClick={() => onDecide(item.id, 'dismiss')}
              >
                Dismiss
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
