'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { Notification } from '@/lib/types';

export default function NotificationsPage() {
  const { data, error, loading, reload } =
    useApi<{ items: Notification[] }>('/notifications');
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const unread = data?.items.filter((item) => item.readAt === null) ?? [];

  async function markAll() {
    setActionError(null);
    setBusy(true);
    try {
      await api.patch('/notifications/read-all', {});
      await reload();
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function markOne(id: string) {
    setActionError(null);
    try {
      await api.patch(`/notifications/${id}/read`, {});
      await reload();
    } catch (cause) {
      setActionError(errorMessage(cause));
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge tone="brand">Notifications</Badge>
          <h1 className="mt-6 font-display text-section font-semibold">
            What you missed.
          </h1>
        </div>
        {unread.length > 0 ? (
          <Button variant="outline" onClick={markAll} disabled={busy}>
            Mark all read
          </Button>
        ) : null}
      </div>

      <div className="mt-12">
        {error ? <ErrorNotice message={error} /> : null}
        {actionError ? <ErrorNotice message={actionError} /> : null}

        {loading ? (
          <Skeleton className="h-48" />
        ) : data && data.items.length > 0 ? (
          <ul className="flex flex-col divide-y divide-hairline rounded-card border border-hairline bg-surface">
            {data.items.map((item) => (
              <li key={item.id} className="flex items-start gap-4 p-6">
                <span
                  aria-hidden
                  className={cn(
                    'mt-2 h-2 w-2 shrink-0 rounded-pill',
                    item.readAt === null ? 'bg-brand' : 'bg-hairline',
                  )}
                />
                <div className="flex-1">
                  <p className="font-semibold">{item.title}</p>
                  {item.message ? (
                    <p className="mt-1 text-muted">{item.message}</p>
                  ) : null}
                  <p className="mt-1 text-sm text-muted">
                    {formatDate(item.createdAt)}
                  </p>
                </div>
                {item.readAt === null ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markOne(item.id)}
                  >
                    Mark read
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : !error ? (
          <EmptyState title="Nothing here yet." />
        ) : null}
      </div>
    </div>
  );
}
