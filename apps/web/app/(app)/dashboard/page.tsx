'use client';

import { cn } from '@/lib/utils/cn';
import { cardSurface } from '@/components/ui/card';
import {
  Bell,
  ChevronRight,
  FolderKanban,
  Inbox,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState, Skeleton } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate, titleCase } from '@/lib/utils/format';
import { useApi } from '@/lib/api/use-api';
import type { Notification, Project, ProjectRequest } from '@/lib/types';

export default function DashboardPage() {
  const { user } = useSession();
  const router = useRouter();
  const isAdmin = user?.role === 'ADMIN';
  const projects = useApi<{ items: Project[] }>('/projects');
  const requests = useApi<{ items: ProjectRequest[] }>('/requests');
  const notifications = useApi<{ items: Notification[] }>('/notifications');

  useEffect(() => {
    if (isAdmin) router.replace('/admin');
  }, [isAdmin, router]);

  const isClient = user?.activeRole === 'CLIENT';
  const activeProjects =
    projects.data?.items.filter((project) => project.status === 'ACTIVE') ?? [];
  const openRequests =
    requests.data?.items.filter((request) =>
      ['OPEN', 'PENDING'].includes(request.status),
    ) ?? [];
  const unread =
    notifications.data?.items.filter((item) => item.readAt === null) ?? [];

  if (isAdmin) return null;

  return (
    <div>
      <PageHeader
        variant="app"
        eyebrow="Overview"
        title={`Welcome back, ${user?.name.split(' ')[0]}.`}
        action={
          isClient ? (
            <ButtonLink href="/briefs/new">Start a brief</ButtonLink>
          ) : (
            <ButtonLink href="/requests">Find work</ButtonLink>
          )
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatTile
          href="/projects"
          icon={FolderKanban}
          label="Active projects"
          value={activeProjects.length}
          loading={projects.loading}
        />
        <StatTile
          href="/requests"
          icon={Inbox}
          label="Open requests"
          value={openRequests.length}
          loading={requests.loading}
        />
        <StatTile
          href="/notifications"
          icon={Bell}
          label="Unread alerts"
          value={unread.length}
          loading={notifications.loading}
        />
      </div>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section aria-labelledby="projects-title">
        <div className="flex items-center justify-between gap-4">
          <h2 id="projects-title" className="font-display text-lg font-semibold">
            Active projects
          </h2>
          <Link href="/projects" className="text-sm font-medium text-brand hover:underline">
            View all
          </Link>
        </div>

        <div className="mt-3">
          {projects.loading ? (
            <Skeleton className="h-32" />
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
            <ul className={cn(cardSurface, 'divide-y divide-hairline overflow-hidden')}>
              {activeProjects.slice(0, 5).map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="group flex items-center justify-between gap-4 px-5 py-3.5 transition-colors duration-200 hover:bg-sand/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold group-hover:text-brand">
                        {project.title}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-muted">
                        Stage {titleCase(project.currentStage)} · Started{' '}
                        {formatDate(project.startedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusBadge status={project.status} />
                      <ChevronRight
                        aria-hidden
                        className="hidden h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand sm:block"
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-labelledby="activity-title">
        <div className="flex items-center justify-between gap-4">
          <h2 id="activity-title" className="font-display text-lg font-semibold">
            Recent activity
          </h2>
          <Link href="/notifications" className="text-sm font-medium text-brand hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-3">
          {notifications.loading ? (
            <Skeleton className="h-32" />
          ) : notifications.data && notifications.data.items.length > 0 ? (
            <ul className={cn(cardSurface, 'divide-y divide-hairline overflow-hidden')}>
              {notifications.data.items.slice(0, 6).map((item) => (
                <li key={item.id} className="flex gap-3 px-5 py-3">
                  <span
                    aria-hidden
                    className={
                      item.readAt === null
                        ? 'mt-2 h-2 w-2 shrink-0 rounded-pill bg-brand'
                        : 'mt-2 h-2 w-2 shrink-0 rounded-pill bg-hairline'
                    }
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{item.title}</p>
                    {item.message ? (
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted">{item.message}</p>
                    ) : null}
                    <p className="mt-0.5 text-xs text-muted">
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
    </div>
  );
}

function StatTile({
  href,
  icon: Icon,
  label,
  value,
  loading,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-card bg-sand p-5 transition-colors hover:bg-brand-soft"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-canvas text-brand">
        <Icon aria-hidden className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        {loading ? (
          <Skeleton className="h-8 w-10 bg-canvas" />
        ) : (
          <span className="block font-display text-3xl font-semibold leading-none text-brand">
            {value}
          </span>
        )}
        <span className="mt-1.5 block text-sm text-ink/70 group-hover:text-ink">{label}</span>
      </span>
    </Link>
  );
}
