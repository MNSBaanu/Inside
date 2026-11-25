'use client';

import { ChevronLeft, MessageCircle, Search } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import {
  CHAT_PANEL_HEIGHT,
  MessageThread,
} from '@/components/features/projects/message-thread';
import {
  AdminSupportInbox,
  SUPPORT_PARTY,
  SupportAvatar,
  SupportRow,
  shortTime,
  type SupportSummary,
} from '@/components/features/support/support-inbox';
import { useSession } from '@/components/providers/session-provider';
import { Avatar } from '@/components/ui/avatar';
import { ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { useApi } from '@/lib/api/use-api';
import { useSocketEvent } from '@/lib/realtime/socket';
import type { ProjectListItem } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

function Inbox() {
  const { user } = useSession();
  if (user?.role === 'ADMIN') return <AdminSupportInbox adminId={user.id} />;
  return <PeopleInbox />;
}

function PeopleInbox() {
  const { user } = useSession();
  const searchParams = useSearchParams();
  const { data, error, loading, refresh } = useApi<{ items: ProjectListItem[] }>('/projects');
  const support = useApi<SupportSummary>('/support/summary');
  useSocketEvent('conversation:updated', () => {
    void refresh();
    void support.refresh();
  });
  const [query, setQuery] = useState('');

  const threads = [...(data?.items ?? [])].sort((a, b) => {
    const left = a.lastMessage?.sentAt ?? a.updatedAt;
    const right = b.lastMessage?.sentAt ?? b.updatedAt;
    return new Date(right).getTime() - new Date(left).getTime();
  });
  const partnerOf = (project: ProjectListItem) =>
    user?.id === project.clientId ? project.designer : project.client;
  const search = query.trim().toLowerCase();
  const visible = threads.filter(
    (project) =>
      !search ||
      project.title.toLowerCase().includes(search) ||
      (partnerOf(project)?.name ?? '').toLowerCase().includes(search),
  );

  const chosenId = searchParams.get('project');
  const supportOpen = searchParams.get('support') === '1';
  const open = threads.find((project) => project.id === chosenId) ?? null;
  const newestThread = threads[0];
  const supportIsNewest =
    !newestThread ||
    (support.data?.lastMessage
      ? new Date(support.data.lastMessage.sentAt).getTime() >
        new Date(newestThread.lastMessage?.sentAt ?? newestThread.updatedAt).getTime()
      : false);
  const selected = supportOpen ? null : (open ?? (supportIsNewest ? null : newestThread));
  const showSupport = supportOpen || !selected;

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    );
  }
  if (error) return <ErrorNotice message={error} />;

  return (
    <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <aside
        className={cn(
          'flex flex-col overflow-hidden rounded-card border border-hairline bg-surface',
          CHAT_PANEL_HEIGHT,
          (open || supportOpen) && 'hidden lg:flex',
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
              placeholder="Search conversations"
              aria-label="Search conversations"
              className="w-full rounded-pill border border-hairline bg-canvas py-2 pl-10 pr-4 text-sm focus:border-brand focus:outline-none"
            />
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto">
          <li>
            <SupportRow active={showSupport} data={support.data} />
          </li>
          {visible.map((project) => {
            const partner = partnerOf(project);
            const unread = project.unreadCount > 0;
            const active = selected?.id === project.id;
            const fromMe = project.lastMessage?.senderId === user?.id;
            return (
              <li key={project.id}>
                <Link
                  href={`/messages?project=${project.id}`}
                  scroll={false}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 transition-colors',
                    active ? 'bg-brand-soft/70' : 'hover:bg-sand/60',
                  )}
                >
                  {partner ? (
                    <Avatar name={partner.name} src={partner.avatarUrl} size={44} />
                  ) : (
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                      <MessageCircle aria-hidden className="h-5 w-5" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={cn('truncate', unread ? 'font-bold' : 'font-semibold')}>
                        {partner?.name ?? project.title}
                      </p>
                      <span
                        className={cn('shrink-0 text-xs', unread ? 'font-semibold text-brand' : 'text-muted')}
                      >
                        {shortTime(project.lastMessage?.sentAt ?? project.updatedAt)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted">{project.title}</p>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className={cn('truncate text-sm', unread ? 'text-ink' : 'text-muted')}>
                        {project.lastMessage
                          ? `${fromMe ? 'You: ' : ''}${project.lastMessage.content}`
                          : 'No messages yet.'}
                      </p>
                      {unread ? (
                        <span
                          aria-label={`${project.unreadCount} unread`}
                          className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-canvas"
                        >
                          {project.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
          {visible.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted">
              {threads.length === 0
                ? 'Project chats appear here once a project starts.'
                : 'No conversations match.'}
            </li>
          ) : null}
        </ul>
      </aside>

      {showSupport && user ? (
        <MessageThread
          fill
          key="support"
          projectId={`support:${user.id}`}
          basePath="/support/messages"
          projectRoom={false}
          currentUserId={user.id}
          partner={SUPPORT_PARTY}
          partnerAvatar={(size) => <SupportAvatar size={size} />}
          subtitle="The Inside team usually replies within a day"
          emptyHint="Questions about your account, a project or a payment? Ask here."
          className={cn(!supportOpen && 'hidden lg:flex')}
          headerStart={
            <Link
              href="/messages"
              aria-label="Back to conversations"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink hover:bg-sand lg:hidden"
            >
              <ChevronLeft aria-hidden className="h-5 w-5" />
            </Link>
          }
        />
      ) : null}

      {selected && user ? (
        <MessageThread
          fill
          key={selected.id}
          projectId={selected.id}
          currentUserId={user.id}
          partner={partnerOf(selected)}
          subtitle={selected.title}
          className={cn(!open && 'hidden lg:flex')}
          headerStart={
            <Link
              href="/messages"
              aria-label="Back to conversations"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink hover:bg-sand lg:hidden"
            >
              <ChevronLeft aria-hidden className="h-5 w-5" />
            </Link>
          }
          headerAction={
            <Link
              href={`/projects/${selected.id}`}
              className="shrink-0 rounded-pill px-3 py-1.5 text-sm font-semibold text-brand hover:bg-brand-soft"
            >
              Open project
            </Link>
          }
        />
      ) : null}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <div className="lg:-mb-[6.5rem]">
      <h1 className="sr-only">Messages</h1>
      <Suspense fallback={<Skeleton className="h-64" />}>
        <Inbox />
      </Suspense>
    </div>
  );
}
