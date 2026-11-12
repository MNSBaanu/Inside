'use client';

import Link from 'next/link';
import {
  ActivityRow,
  AdminOnly,
  useIsAdmin,
} from '@/components/features/admin/admin-sections';
import { cardSurface } from '@/components/ui/card';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/page-header';
import { useApi } from '@/lib/api/use-api';
import type { ActivityEntry } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

type AdminStats = {
  users: number;
  clients: number;
  designers: number;
  suspended: number;
  pendingVerifications: number;
  openReports: number;
  hiddenReviews: number;
  activeProjects: number;
};

export default function AdminOverviewPage() {
  const isAdmin = useIsAdmin();
  const stats = useApi<AdminStats>(isAdmin ? '/admin/stats' : null);
  const activity = useApi<{ items: ActivityEntry[] }>(
    isAdmin ? '/admin/activity?pageSize=6' : null,
  );
  const data = stats.data;

  return (
    <AdminOnly>
      <PageHeader
        variant="app"
        eyebrow="Admin"
        title="Overview."
        description="What needs a decision today, and how the platform is doing."
      />

      {stats.error ? (
        <div className="mt-10">
          <ErrorNotice message={stats.error} />
        </div>
      ) : null}

      <section className="mt-10">
        <h2 className="ui-label text-ink/70">Needs attention</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatTile
            href="/admin/verifications"
            label="Pending verifications"
            value={data?.pendingVerifications}
            urgent
          />
          <StatTile
            href="/admin/reports"
            label="Open reports"
            value={data?.openReports}
            urgent
          />
          <StatTile
            href="/admin/reviews"
            label="Hidden reviews"
            value={data?.hiddenReviews}
            urgent
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="ui-label text-ink/70">Platform</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatTile
            href="/admin/users"
            label="Users"
            value={data?.users}
            note={
              data ? `${data.clients} clients · ${data.designers} designers` : undefined
            }
          />
          <StatTile
            href="/admin/users"
            label="Suspended accounts"
            value={data?.suspended}
          />
          <StatTile
            href="/admin/activity"
            label="Active projects"
            value={data?.activeProjects}
          />
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold">
            Recent activity
          </h2>
          <Link href="/admin/activity" className="ui-label link-underline text-ink">
            View all
          </Link>
        </div>
        <div className="mt-6">
          {activity.loading ? (
            <Skeleton className="h-48" />
          ) : activity.error ? (
            <ErrorNotice message={activity.error} />
          ) : activity.data && activity.data.items.length > 0 ? (
            <ul className={cn(cardSurface, 'flex flex-col divide-y divide-hairline')}>
              {activity.data.items.map((entry) => (
                <ActivityRow key={entry.id} entry={entry} />
              ))}
            </ul>
          ) : (
            <EmptyState title="No activity yet." />
          )}
        </div>
      </section>
    </AdminOnly>
  );
}

function StatTile({
  href,
  label,
  value,
  note,
  urgent = false,
}: {
  href: string;
  label: string;
  value: number | undefined;
  note?: string;
  urgent?: boolean;
}) {
  const highlighted = urgent && value !== undefined && value > 0;
  return (
    <Link
      href={href}
      className={cn(
        'rounded-card p-6 transition-colors duration-300',
        highlighted
          ? 'bg-highlight-soft hover:bg-highlight-soft/70'
          : 'bg-sand hover:bg-sand/70',
      )}
    >
      <p className="ui-label text-ink/70">{label}</p>
      {value === undefined ? (
        <Skeleton className="mt-4 h-10 w-14 bg-canvas" />
      ) : (
        <p
          className={cn(
            'mt-3 font-display text-4xl font-semibold',
            highlighted ? 'text-status-action' : 'text-brand',
          )}
        >
          {value}
        </p>
      )}
      {note ? <p className="mt-2 text-sm text-muted">{note}</p> : null}
    </Link>
  );
}
