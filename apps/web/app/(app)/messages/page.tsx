'use client';

import { cn } from '@/lib/utils/cn';
import { cardSurface } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { formatDate, titleCase } from '@/lib/utils/format';
import { useApi } from '@/lib/api/use-api';
import type { ProjectListItem } from '@/lib/types';

export default function MessagesPage() {
  const { data, error, loading } = useApi<{ items: ProjectListItem[] }>(
    '/projects',
  );

  const threads = [...(data?.items ?? [])].sort((a, b) => {
    const left = a.lastMessage?.sentAt ?? a.updatedAt;
    const right = b.lastMessage?.sentAt ?? b.updatedAt;
    return new Date(right).getTime() - new Date(left).getTime();
  });

  return (
    <div>
      <PageHeader
        variant="app"
        eyebrow="Messages"
        title="Conversations."
        description="Messages live inside each project, so context never gets separated from the work."
      />

      <div className="mt-8">
        {error ? <ErrorNotice message={error} /> : null}

        {loading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : threads.length > 0 ? (
          <ul className={cn(cardSurface, 'divide-y divide-hairline overflow-hidden')}>
            {threads.map((project) => {
              const unread = project.unreadCount > 0;
              return (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="group flex items-center gap-4 px-5 py-3.5 transition-colors duration-200 hover:bg-sand/50"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                      <MessageSquare aria-hidden className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className={cn('truncate group-hover:text-brand', unread ? 'font-bold' : 'font-semibold')}>
                          {project.title}
                        </p>
                        <span className="shrink-0 text-xs text-muted">
                          {formatDate(project.lastMessage?.sentAt ?? project.updatedAt)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-3">
                        <p className={cn('truncate text-sm', unread ? 'text-ink' : 'text-muted')}>
                          {project.lastMessage
                            ? project.lastMessage.content
                            : 'No messages yet.'}
                        </p>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="hidden text-xs text-muted sm:inline">
                            {titleCase(project.currentStage)}
                          </span>
                          {unread ? (
                            <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-canvas">
                              {`${project.unreadCount} unread`}
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : !error ? (
          <EmptyState
            title="No conversations yet."
            description="Once a project starts, you can message the other party here."
            action={<ButtonLink href="/projects">View projects</ButtonLink>}
          />
        ) : null}
      </div>
    </div>
  );
}
