'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate, titleCase } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { Project } from '@/lib/types';

export default function MessagesPage() {
  const { data, error, loading } = useApi<{ items: Project[] }>('/projects');

  return (
    <div>
      <Badge tone="clay">Messages</Badge>
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
        ) : data && data.items.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {data.items.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-hairline bg-surface p-6 transition-colors duration-300 hover:border-clay"
                >
                  <div>
                    <p className="font-display text-xl font-semibold">
                      {project.title}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {titleCase(project.currentStage)} ·{' '}
                      {formatDate(project.updatedAt)}
                    </p>
                  </div>
                  <StatusBadge status={project.status} />
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
