'use client';

import { AlertTriangle, Megaphone, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { useApi } from '@/lib/api/use-api';
import { useSocketEvent } from '@/lib/realtime/socket';
import { cn } from '@/lib/utils/cn';

export type AnnouncementTone = 'INFO' | 'WARNING';

export type Announcement = {
  id: string;
  title: string;
  message: string;
  audience: 'ALL' | 'CLIENTS' | 'DESIGNERS';
  tone: AnnouncementTone;
  endsAt: string | null;
  createdAt: string;
};

const DISMISSED_KEY = 'inside:dismissed-announcements';

function readDismissed(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]') as unknown;
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function AnnouncementCard({
  title,
  message,
  tone,
  onDismiss,
}: {
  title: string;
  message: string;
  tone: AnnouncementTone;
  onDismiss?: () => void;
}) {
  const Icon = tone === 'WARNING' ? AlertTriangle : Megaphone;
  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-3 rounded-card border px-4 py-3',
        tone === 'WARNING'
          ? 'border-highlight/40 bg-highlight-soft text-status-action'
          : 'border-brand/20 bg-brand-soft text-brand-deep',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          tone === 'WARNING' ? 'bg-highlight/20' : 'bg-brand/10',
        )}
      >
        <Icon aria-hidden className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title || 'Announcement title'}</p>
        <p className="mt-0.5 whitespace-pre-line text-sm opacity-90">
          {message || 'Your message will appear here.'}
        </p>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss announcement"
          className="rounded-full p-1 opacity-70 transition-opacity hover:opacity-100"
        >
          <X aria-hidden className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

export function AnnouncementBanner() {
  const { user } = useSession();
  const { data, reload } = useApi<{ items: Announcement[] }>(
    user ? '/announcements/active' : null,
  );
  const [dismissed, setDismissed] = useState<string[]>([]);

  useSocketEvent('announcement:new', () => void reload());

  useEffect(() => setDismissed(readDismissed()), []);

  function dismiss(id: string) {
    const next = [...dismissed, id];
    setDismissed(next);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(next.slice(-50)));
    } catch {
      // Dismissal still applies for this visit.
    }
  }

  const visible = (data?.items ?? []).filter((item) => !dismissed.includes(item.id));
  if (visible.length === 0) return null;

  return (
    <div className="mb-6 flex flex-col gap-2">
      {visible.map((item) => (
        <AnnouncementCard
          key={item.id}
          title={item.title}
          message={item.message}
          tone={item.tone}
          onDismiss={() => dismiss(item.id)}
        />
      ))}
    </div>
  );
}
