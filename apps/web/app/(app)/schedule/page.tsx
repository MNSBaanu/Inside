'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useSession } from '@/components/providers/session-provider';
import { cardSurface } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { useApi } from '@/lib/api/use-api';
import { cn } from '@/lib/utils/cn';
import { formatDate, titleCase } from '@/lib/utils/format';

type ScheduleItem = {
  id: string;
  name: string;
  status: string;
  dueDate: string | null;
  project: {
    id: string;
    title: string;
    status: string;
    clientName: string;
  };
};

const DAY = 86_400_000;

const groups = [
  { key: 'overdue', title: 'Overdue' },
  { key: 'waiting', title: 'Waiting on client' },
  { key: 'week', title: 'Next 7 days' },
  { key: 'later', title: 'Later' },
  { key: 'none', title: 'No due date' },
] as const;

type GroupKey = (typeof groups)[number]['key'];

function groupOf(item: ScheduleItem, today: number): GroupKey {
  if (item.status === 'SUBMITTED') return 'waiting';
  const { dueDate } = item;
  if (!dueDate) return 'none';
  const due = new Date(dueDate).getTime();
  if (due < today) return 'overdue';
  if (due < today + 8 * DAY) return 'week';
  return 'later';
}

export default function SchedulePage() {
  const { user } = useSession();
  const isDesigner = user?.activeRole === 'DESIGNER';
  const { data, error, loading } = useApi<{ items: ScheduleItem[] }>(
    isDesigner ? '/stages/schedule' : null,
  );

  if (user && !isDesigner) {
    return (
      <EmptyState
        title="The schedule is for designers."
        description="Switch to your designer account to see stage due dates."
      />
    );
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const today = start.getTime();
  const items = data?.items ?? [];

  return (
    <div>
      <PageHeader
        variant="app"
        eyebrow="Schedule"
        title="What's due."
        description="Every open stage across your active projects, soonest first."
      />

      <div className="mt-8">
        {error ? <ErrorNotice message={error} /> : null}

        {loading || !user ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : items.length > 0 ? (
          <div className="flex flex-col gap-8">
            {groups.map((group) => {
              const rows = items.filter(
                (item) => groupOf(item, today) === group.key,
              );
              if (rows.length === 0) return null;
              return (
                <section key={group.key} aria-labelledby={`group-${group.key}`}>
                  <h2
                    id={`group-${group.key}`}
                    className={cn(
                      'mb-3 text-sm font-semibold uppercase tracking-wider',
                      group.key === 'overdue' ? 'text-error' : 'text-ink/70',
                    )}
                  >
                    {group.title}{' '}
                    <span className="font-normal text-muted">{rows.length}</span>
                  </h2>
                  <ul className={cn(cardSurface, 'divide-y divide-hairline overflow-hidden')}>
                    {rows.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={`/projects/${item.project.id}`}
                          className="group grid items-center gap-x-6 gap-y-2 px-5 py-4 transition-colors duration-200 hover:bg-sand/50 md:grid-cols-[minmax(0,1fr)_9rem_auto_auto]"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold group-hover:text-brand">
                              {titleCase(item.name)} · {item.project.title}
                            </p>
                            <p className="mt-0.5 truncate text-sm text-muted">
                              Client: {item.project.clientName}
                              {item.project.status === 'ON_HOLD' ? ' · Project on hold' : ''}
                            </p>
                          </div>
                          <p
                            className={cn(
                              'text-sm',
                              group.key === 'overdue' ? 'font-medium text-error' : 'text-ink',
                            )}
                          >
                            {item.dueDate ? `Due ${formatDate(item.dueDate)}` : 'Not scheduled'}
                          </p>
                          <StatusBadge status={item.status} />
                          <ChevronRight
                            aria-hidden
                            className="hidden h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand md:block"
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        ) : !error ? (
          <EmptyState
            title="Nothing due."
            description="Stages from your active projects show up here with their due dates."
            action={<ButtonLink href="/projects">View projects</ButtonLink>}
          />
        ) : null}
      </div>
    </div>
  );
}
