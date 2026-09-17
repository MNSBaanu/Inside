'use client';

import Link from 'next/link';
import { useSession } from '@/components/providers/session-provider';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState, Skeleton } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate, titleCase } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { Notification, Project, ProjectRequest } from '@/lib/types';

export default function DashboardPage() {
  const { user } = useSession();
  const projects = useApi<{ items: Project[] }>('/projects');
  const requests = useApi<{ items: ProjectRequest[] }>('/requests');
  const notifications = useApi<{ items: Notification[] }>('/notifications');

  const isClient = user?.activeRole === 'CLIENT';
  const activeProjects =
    projects.data?.items.filter((project) => project.status === 'ACTIVE') ?? [];
  const openRequests =
    requests.data?.items.filter((request) =>
      ['OPEN', 'PENDING'].includes(request.status),
    ) ?? [];
  const unread =
    notifications.data?.items.filter((item) => item.readAt === null) ?? [];

  return (
    <div>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge tone="clay">Overview</Badge>
          <h1 className="mt-6 font-display text-section font-semibold">
            Welcome back, {user?.name.split(' ')[0]}.
          </h1>
        </div>
        {isClient ? (
          <ButtonLink href="/briefs/new" size="lg">
            Start a brief
          </ButtonLink>
        ) : (
          <ButtonLink href="/requests" size="lg">
            Find work
          </ButtonLink>
        )}
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        <StatTile
          label="Active projects"
          value={activeProjects.length}
          loading={projects.loading}
        />
        <StatTile
          label="Open requests"
          value={openRequests.length}
          loading={requests.loading}
        />
        <StatTile
          label="Unread alerts"
          value={unread.length}
          loading={notifications.loading}
        />
      </div>

      <section className="mt-16">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold">Your projects</h2>
          <Link href="/projects" className="label link-underline text-ink">
            View all
          </Link>
        </div>

        <div className="mt-6">
          {projects.loading ? (
            <Skeleton className="h-40" />
          ) : activeProjects.length === 0 ? (
            <EmptyState
              title="No active projects yet."
              description={
                isClient
                  ? 'Once you accept a proposal, the project appears here.'
                  : 'Projects appear here once a client accepts your proposal.'
              }
              action={
                isClient ? (
                  <ButtonLink href="/briefs/new">Start a brief</ButtonLink>
                ) : undefined
              }
            />
          ) : (
            <ul className="flex flex-col gap-4">
              {activeProjects.slice(0, 4).map((project) => (
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
                        Current stage: {titleCase(project.currentStage)} ·
                        Started {formatDate(project.startedAt)}
                      </p>
                    </div>
                    <StatusBadge status={project.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold">Recent activity</h2>
        <div className="mt-6">
          {notifications.loading ? (
            <Skeleton className="h-32" />
          ) : notifications.data && notifications.data.items.length > 0 ? (
            <ul className="flex flex-col divide-y divide-hairline rounded-card border border-hairline bg-surface">
              {notifications.data.items.slice(0, 6).map((item) => (
                <li key={item.id} className="flex gap-4 p-5">
                  <span
                    aria-hidden
                    className={
                      item.readAt === null
                        ? 'mt-2 h-2 w-2 shrink-0 rounded-pill bg-clay'
                        : 'mt-2 h-2 w-2 shrink-0 rounded-pill bg-hairline'
                    }
                  />
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    {item.message ? (
                      <p className="mt-1 text-sm text-muted">{item.message}</p>
                    ) : null}
                    <p className="mt-1 text-sm text-muted">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nothing has happened yet." />
          )}
        </div>
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="rounded-card bg-sand p-8">
      <p className="label text-ink/70">{label}</p>
      {loading ? (
        <Skeleton className="mt-4 h-12 w-16 bg-canvas" />
      ) : (
        <p className="mt-4 font-display text-5xl font-semibold text-clay">
          {value}
        </p>
      )}
    </div>
  );
}
