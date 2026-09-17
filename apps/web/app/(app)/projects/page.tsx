'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate, titleCase } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { Project } from '@/lib/types';

export default function ProjectsPage() {
  const { data, error, loading } = useApi<{ items: Project[] }>('/projects');

  return (
    <div>
      <Badge tone="brand">Projects</Badge>
      <h1 className="mt-6 font-display text-section font-semibold">
        Work in progress.
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        Every accepted proposal becomes a project with stages, deliverables and
        milestone payments.
      </p>

      <div className="mt-12">
        {error ? <ErrorNotice message={error} /> : null}

        {loading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        ) : data && data.items.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {data.items.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-hairline bg-surface p-6 transition-colors duration-300 hover:border-brand"
                >
                  <div>
                    <p className="font-display text-xl font-semibold">
                      {project.title}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Stage: {titleCase(project.currentStage)} · Started{' '}
                      {formatDate(project.startedAt)}
                    </p>
                  </div>
                  <StatusBadge status={project.status} />
                </Link>
              </li>
            ))}
          </ul>
        ) : !error ? (
          <EmptyState
            title="No projects yet."
            description="Accept a proposal and the project workspace opens up here."
            action={<ButtonLink href="/requests">View requests</ButtonLink>}
          />
        ) : null}
      </div>
    </div>
  );
}
