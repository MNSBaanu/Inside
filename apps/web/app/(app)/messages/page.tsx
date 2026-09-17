'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate, titleCase } from '@/lib/format';
import { useApi } from '@/lib/use-api';
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
      <Badge tone="brand">Messages</Badge>
      <h1 className="mt-6 font-display text-section font-semibold">
        Conversations.
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        Messages live inside each project, so context never gets separated from
        the work.
      </p>

      <div className="mt-12">
        {error ? <ErrorNotice message={error} /> : null}

        {loading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : threads.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {threads.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-hairline bg-surface p-6 transition-colors duration-300 hover:border-brand"
                >
                  <div className="min-w-0">
                    <p className="font-display text-xl font-semibold">
                      {project.title}
                    </p>
                    <p className="mt-1 truncate text-sm text-muted">
                      {project.lastMessage
                        ? project.lastMessage.content
                        : 'No messages yet.'}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {titleCase(project.currentStage)} ·{' '}
                      {formatDate(
                        project.lastMessage?.sentAt ?? project.updatedAt,
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {project.unreadCount > 0 ? (
                      <Badge tone="brand">
                        {project.unreadCount} unread
                      </Badge>
                    ) : null}
                    <StatusBadge status={project.status} />
                  </div>
                </Link>
              </li>
            ))}
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
