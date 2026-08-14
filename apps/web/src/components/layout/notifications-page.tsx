'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { StatusPill } from '@/components/layout/status-pill';
import { EmptyState } from '@/components/layout/empty-state';
import { formatApiError } from '@/lib/api/auth';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/api/notifications';
import type { AppNotification } from '@/lib/api/types';
import { formatRelativeTime } from '@/lib/time';
import { usePoll } from '@/lib/use-poll';
import { cn } from '@/lib/utils';

function hrefFor(item: AppNotification): string | null {
  const projectId = item.metadata?.projectId;
  if (typeof projectId === 'string' && projectId.length > 0) {
    return `/projects/${projectId}`;
  }
  if (item.type === 'VERIFICATION') return '/designer/verification';
  return null;
}

export function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (options: { silent?: boolean } = {}) => {
    if (!options.silent) setLoading(true);
    try {
      const data = await listNotifications();
      setItems(data.items);
      setError(null);
    } catch (err) {
      if (!options.silent) setError(formatApiError(err));
    } finally {
      if (!options.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  usePoll(() => void load({ silent: true }), 20_000);

  const unread = items.filter((item) => !item.isRead).length;

  async function onOpen(item: AppNotification) {
    setBusy(true);
    try {
      if (!item.isRead) {
        await markNotificationRead(item.id);
        setItems((prev) =>
          prev.map((entry) =>
            entry.id === item.id ? { ...entry, isRead: true } : entry,
          ),
        );
      }
      const href = hrefFor(item);
      if (href) router.push(href);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onMarkAll() {
    setBusy(true);
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Account"
        title="Notifications"
        description="Everything that happened across your requests, projects, and account."
        actions={
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy || unread === 0}
            onClick={() => void onMarkAll()}
          >
            Mark all read
          </Button>
        }
      />

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}

      {!loading && items.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="Updates about proposals, stages, payments, and messages will land here."
        />
      ) : null}

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              disabled={busy}
              onClick={() => void onOpen(item)}
              className={cn(
                'surface-panel flex w-full flex-col gap-2 p-4 text-left transition-shadow hover:shadow-[0_22px_60px_-32px_oklch(0.22_0.02_145_/_0.55)]',
                !item.isRead && 'border-primary/30',
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill value={item.type} />
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(item.createdAt)}
                </span>
                {!item.isRead ? (
                  <span className="text-[11px] uppercase tracking-wider text-primary">
                    Unread
                  </span>
                ) : null}
              </div>
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.message}</p>
            </button>
          </li>
        ))}
      </ul>

      <Link
        href="/projects"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        Back to projects
      </Link>
    </div>
  );
}
