'use client';

import { cn } from '@/lib/utils/cn';
import { cardSurface } from '@/components/ui/card';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate, titleCase } from '@/lib/utils/format';
import { useApi } from '@/lib/api/use-api';
import type { Project } from '@/lib/types';

export default function ProjectsPage() {
  const { data, error, loading } = useApi<{ items: Project[] }>('/projects');

  return (
    <div>
      <PageHeader
        variant="app"
        eyebrow="Projects"
        title="Work in progress."
        description="Every accepted proposal becomes a project with stages, deliverables and milestone payments."
      />

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
                  className={cn(cardSurface, 'flex flex-wrap items-center justify-between gap-4 p-6 transition-colors duration-300 hover:border-brand')}
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
