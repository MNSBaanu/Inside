'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/layout/status-pill';
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

const POLL_MS = 20_000;

function hrefForNotification(item: AppNotification): string | null {
  const projectId = item.metadata?.projectId;
  if (typeof projectId === 'string' && projectId.length > 0) {
    return `/projects/${projectId}`;
  }
  if (item.type === 'VERIFICATION') return '/designer/verification';
  return null;
}

export function NotificationBell() {
  const router = useRouter();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
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

  usePoll(() => void load({ silent: true }), POLL_MS);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const unread = items.filter((item) => !item.isRead).length;

  async function onOpenItem(item: AppNotification) {
    setBusy(true);
    try {
      if (!item.isRead) {
        await markNotificationRead(item.id);
        setItems((prev) =>
          prev.map((entry) =>
            entry.id === item.id
              ? { ...entry, isRead: true, readAt: new Date().toISOString() }
              : entry,
          ),
        );
      }
      const href = hrefForNotification(item);
      setOpen(false);
      if (href) router.push(href);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onMarkAll() {
    setBusy(true);
    setError(null);
    try {
      await markAllNotificationsRead();
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt ?? new Date().toISOString(),
        })),
      );
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={
          unread > 0
            ? `Notifications, ${unread} unread`
            : 'Notifications'
        }
        onClick={() => setOpen((value) => !value)}
        className="relative"
      >
        <span aria-hidden="true" className="inline-flex size-4 items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
            <path
              d="M6 9a6 6 0 1 1 12 0c0 3.5 1.5 5 2.5 6H3.5C4.5 14 6 12.5 6 9Z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
            <path
              d="M10 18a2 2 0 0 0 4 0"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </span>
        {unread > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] leading-4 font-medium text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Notifications"
          className="glass-strong absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
            <p className="text-sm font-medium">Notifications</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy || unread === 0}
              onClick={() => void onMarkAll()}
            >
              Mark all read
            </Button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                Loading…
              </p>
            ) : null}

            {error ? (
              <p className="px-4 py-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            {!loading && items.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                You are all caught up.
              </p>
            ) : null}

            <ul>
              {items.slice(0, 12).map((item) => {
                const href = hrefForNotification(item);
                return (
                  <li key={item.id} className="border-b border-border/40 last:border-0">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onOpenItem(item)}
                      className={cn(
                        'flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-foreground/[0.04]',
                        !item.isRead && 'bg-primary/[0.04]',
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill value={item.type} />
                        <span className="text-[11px] text-muted-foreground">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {item.message}
                      </p>
                      {href ? (
                        <span className="text-[11px] text-primary">Open →</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="border-t border-border/60 px-4 py-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              See all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
