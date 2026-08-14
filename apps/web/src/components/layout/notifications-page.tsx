'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/layout/inline-alert';
import { PageHeader } from '@/components/layout/page-header';
import { SkeletonList } from '@/components/layout/skeleton';
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
          <>
            <span className="surface-panel px-3 py-1.5 text-sm text-muted-foreground">
              {unread} unread
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy || unread === 0}
              onClick={() => void onMarkAll()}
            >
              Mark all read
            </Button>
          </>
        }
      />

      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}

      {loading ? <SkeletonList rows={4} /> : null}

      {!loading && items.length === 0 ? (
        <EmptyState
          icon={<Bell className="size-5" />}
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
                'surface-panel group flex w-full items-start gap-4 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_60px_-32px_oklch(0.22_0.02_145_/_0.55)]',
                !item.isRead && 'border-primary/30 bg-primary/[0.03]',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'mt-1.5 size-2 shrink-0 rounded-full',
                  item.isRead ? 'bg-border' : 'bg-primary',
                )}
              />
              <span className="min-w-0 flex-1 space-y-2">
                <span className="flex flex-wrap items-center gap-2">
                  <StatusPill value={item.type} />
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </span>
                <span className="block font-medium">{item.title}</span>
                <span className="block text-sm leading-relaxed text-muted-foreground">
                  {item.message}
                </span>
              </span>
              <ChevronRight
                aria-hidden="true"
                className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              />
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
