'use client';

import { cardSurface } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/page-header';
import { api, errorMessage } from '@/lib/api/client';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/format';
import { useApi } from '@/lib/api/use-api';
import type { Notification } from '@/lib/types';

export default function NotificationsPage() {
  const { data, error, loading, reload } =
    useApi<{ items: Notification[] }>('/notifications');
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [show, setShow] = useState<'all' | 'unread'>('all');
  const unread = data?.items.filter((item) => item.readAt === null) ?? [];
  const visible = show === 'unread' ? unread : (data?.items ?? []);

  async function markAll() {
    setActionError(null);
    setBusy(true);
    try {
      await api.patch('/notifications/read-all', {});
      window.dispatchEvent(new Event('inside:notifications-changed'));
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
      window.dispatchEvent(new Event('inside:notifications-changed'));
      await reload();
    } catch (cause) {
      setActionError(errorMessage(cause));
    }
  }

  return (
    <div>
      <PageHeader
        variant="app"
        eyebrow="Notifications"
        title="What you missed."
        action={
          unread.length > 0 ? (
            <Button variant="outline" size="sm" onClick={markAll} disabled={busy}>
              Mark all read
            </Button>
          ) : null
        }
      />

      <div className="mt-8">
        {error ? <ErrorNotice message={error} /> : null}
        {actionError ? <ErrorNotice message={actionError} /> : null}

        {loading ? (
          <Skeleton className="h-48" />
        ) : data && data.items.length > 0 ? (
          <>
            <div role="group" aria-label="Filter notifications" className="mb-4 flex gap-2">
              {(['all', 'unread'] as const).map((value) => {
                const active = show === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setShow(value)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                      active
                        ? 'border-brand bg-brand text-canvas'
                        : 'border-hairline bg-surface text-ink/80 hover:border-brand hover:text-brand',
                    )}
                  >
                    {value === 'all' ? 'All' : 'Unread'}
                    <span className={active ? 'text-canvas/80' : 'text-muted'}>
                      {value === 'all' ? data.items.length : unread.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {visible.length > 0 ? (
              <ul className={cn(cardSurface, 'divide-y divide-hairline overflow-hidden')}>
                {visible.map((item) => (
                  <li
                    key={item.id}
                    className={cn(
                      'flex items-start gap-3 px-5 py-3',
                      item.readAt === null && 'bg-brand-soft/30',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'mt-2 h-2 w-2 shrink-0 rounded-pill',
                        item.readAt === null ? 'bg-brand' : 'bg-hairline',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{item.title}</p>
                      {item.message ? (
                        <p className="mt-0.5 text-sm text-muted">{item.message}</p>
                      ) : null}
                      <p className="mt-0.5 text-xs text-muted">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                    {item.readAt === null ? (
                      <button
                        type="button"
                        onClick={() => markOne(item.id)}
                        aria-label={`Mark "${item.title}" as read`}
                        title="Mark as read"
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-sand hover:text-brand"
                      >
                        <Check aria-hidden className="h-4 w-4" />
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="You're all caught up." description="No unread notifications." />
            )}
          </>
        ) : !error ? (
          <EmptyState title="Nothing here yet." />
        ) : null}
      </div>
    </div>
  );
}
