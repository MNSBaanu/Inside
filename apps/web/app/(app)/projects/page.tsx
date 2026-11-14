'use client';

import { cn } from '@/lib/utils/cn';
import { cardSurface } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useSession } from '@/components/providers/session-provider';
import { PageHeader } from '@/components/ui/page-header';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate, titleCase } from '@/lib/utils/format';
import { useApi } from '@/lib/api/use-api';
import type { Project } from '@/lib/types';

export default function ProjectsPage() {
  const { data, error, loading } = useApi<{ items: Project[] }>('/projects');
  const { user } = useSession();
  const isClient = user?.activeRole === 'CLIENT';

  return (
    <div>
      <PageHeader
        variant="app"
        eyebrow="Projects"
        title="Work in progress."
        description="Every accepted proposal becomes a project with stages, deliverables and milestone payments."
      />

      <div className="mt-8">
        {error ? <ErrorNotice message={error} /> : null}

        {loading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : data && data.items.length > 0 ? (
          <ul className={cn(cardSurface, 'divide-y divide-hairline overflow-hidden')}>
            {data.items.map((project) => {
              const party = isClient ? project.designer : project.client;
              return (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="group grid items-center gap-x-6 gap-y-2 px-5 py-4 transition-colors duration-200 hover:bg-sand/50 md:grid-cols-[minmax(0,1fr)_10rem_auto_auto]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold group-hover:text-brand">
                        {project.title}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-muted">
                        {party?.name
                          ? `${isClient ? 'Designer' : 'Client'}: ${party.name} · `
                          : ''}
                        Started {formatDate(project.startedAt)}
                      </p>
                    </div>
                    <p className="text-sm">
                      <span className="text-muted">Stage </span>
                      <span className="font-medium">{titleCase(project.currentStage)}</span>
                    </p>
                    <StatusBadge status={project.status} />
                    <ChevronRight
                      aria-hidden
                      className="hidden h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand md:block"
                    />
                  </Link>
                </li>
              );
            })}
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
