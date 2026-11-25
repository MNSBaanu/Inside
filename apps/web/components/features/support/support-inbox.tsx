'use client';

import { ChevronLeft, Headset, Search } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { MessageThread } from '@/components/features/projects/message-thread';
import { Avatar } from '@/components/ui/avatar';
import { ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { useApi } from '@/lib/api/use-api';
import { useSocketEvent } from '@/lib/realtime/socket';
import type { Role } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import { titleCase } from '@/lib/utils/format';

export const SUPPORT_PARTY = { id: 'support', name: 'Inside support', avatarUrl: null };

type LastMessage = { content: string; sentAt: string; fromAdmin: boolean };

type SupportConversation = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  lastMessage: LastMessage | null;
  unreadCount: number;
};

export function shortTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  const days = (now.getTime() - date.getTime()) / 86_400_000;
  if (days < 7) return date.toLocaleDateString(undefined, { weekday: 'short' });
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function SupportRow({ active }: { active: boolean }) {
  const { data, refresh } = useApi<{ unreadCount: number; lastMessage: LastMessage | null }>(
    '/support/summary',
  );
  useSocketEvent('conversation:updated', () => void refresh());
  const unread = (data?.unreadCount ?? 0) > 0;
  const last = data?.lastMessage;
  return (
    <Link
      href="/messages?support=1"
      scroll={false}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'flex items-center gap-3 border-b border-hairline px-3 py-3 transition-colors',
        active ? 'bg-brand-soft/70' : 'hover:bg-sand/60',
      )}
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-canvas">
        <Headset aria-hidden className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={cn('truncate', unread ? 'font-bold' : 'font-semibold')}>Inside support</p>
          {last ? (
            <span className={cn('shrink-0 text-xs', unread ? 'font-semibold text-brand' : 'text-muted')}>
              {shortTime(last.sentAt)}
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className={cn('truncate text-sm', unread ? 'text-ink' : 'text-muted')}>
            {last ? `${last.fromAdmin ? '' : 'You: '}${last.content}` : 'Ask the Inside team anything.'}
          </p>
          {unread ? (
            <span
              aria-label={`${data?.unreadCount} unread`}
              className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-canvas"
            >
              {data?.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

/** Admin view: every client and designer on the left, the support chat with them on the right. */
export function AdminSupportInbox({ adminId }: { adminId: string }) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const { data, error, loading, refresh } = useApi<{ items: SupportConversation[] }>(
    '/admin/support',
  );
  useSocketEvent('conversation:updated', () => void refresh());

  if (loading && !data) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    );
  }
  if (error) return <ErrorNotice message={error} />;

  const people = data?.items ?? [];
  const search = query.trim().toLowerCase();
  const visible = people.filter(
    (person) =>
      !search ||
      person.name.toLowerCase().includes(search) ||
      person.email.toLowerCase().includes(search),
  );
  const chosenId = searchParams.get('user');
  const open = people.find((person) => person.id === chosenId) ?? null;
  const selected = open ?? people[0] ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <aside
        className={cn(
          'flex h-[min(72vh,680px)] flex-col overflow-hidden rounded-card border border-hairline bg-surface',
          open && 'hidden lg:flex',
        )}
      >
        <div className="border-b border-hairline p-3">
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search people"
              aria-label="Search people"
              className="w-full rounded-pill border border-hairline bg-canvas py-2 pl-10 pr-4 text-sm focus:border-brand focus:outline-none"
            />
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {visible.map((person) => {
            const unread = person.unreadCount > 0;
            const active = selected?.id === person.id;
            return (
              <li key={person.id}>
                <Link
                  href={`/messages?user=${person.id}`}
                  scroll={false}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 transition-colors',
                    active ? 'bg-brand-soft/70' : 'hover:bg-sand/60',
                  )}
                >
                  <Avatar name={person.name} src={person.avatarUrl} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={cn('truncate', unread ? 'font-bold' : 'font-semibold')}>
                        {person.name}
                      </p>
                      {person.lastMessage ? (
                        <span
                          className={cn(
                            'shrink-0 text-xs',
                            unread ? 'font-semibold text-brand' : 'text-muted',
                          )}
                        >
                          {shortTime(person.lastMessage.sentAt)}
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-muted">{titleCase(person.role)}</p>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className={cn('truncate text-sm', unread ? 'text-ink' : 'text-muted')}>
                        {person.lastMessage
                          ? `${person.lastMessage.fromAdmin ? 'You: ' : ''}${person.lastMessage.content}`
                          : 'Start a conversation'}
                      </p>
                      {unread ? (
                        <span
                          aria-label={`${person.unreadCount} unread`}
                          className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-canvas"
                        >
                          {person.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
          {visible.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted">No people match.</li>
          ) : null}
        </ul>
      </aside>

      {selected ? (
        <MessageThread
          key={selected.id}
          projectId={`support:${selected.id}`}
          basePath={`/admin/support/${selected.id}/messages`}
          projectRoom={false}
          currentUserId={adminId}
          partner={selected}
          subtitle={`${titleCase(selected.role)} · ${selected.email}`}
          emptyHint={`Send ${selected.name} a message as Inside support.`}
          className={cn(!open && 'hidden lg:flex')}
          headerStart={
            <Link
              href="/messages"
              aria-label="Back to people"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink hover:bg-sand lg:hidden"
            >
              <ChevronLeft aria-hidden className="h-5 w-5" />
            </Link>
          }
          headerAction={
            <Link
              href={`/admin/users/${selected.id}`}
              className="shrink-0 rounded-pill px-3 py-1.5 text-sm font-semibold text-brand hover:bg-brand-soft"
            >
              View user
            </Link>
          }
        />
      ) : null}
    </div>
  );
}
