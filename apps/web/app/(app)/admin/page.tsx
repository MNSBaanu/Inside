'use client';

import {
  FolderKanban,
  Inbox,
  Users,
  UserX,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import {
  ActivityRow,
  AdminOnly,
  useIsAdmin,
} from '@/components/features/admin/admin-sections';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cardSurface } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/page-header';
import { Rating } from '@/components/ui/rating';
import { StatusBadge } from '@/components/ui/status-badge';
import { api, errorMessage } from '@/lib/api/client';
import { useApi } from '@/lib/api/use-api';
import type { ActivityEntry, AdminReview, Role } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import { formatDate, titleCase } from '@/lib/utils/format';
import { safeHref } from '@/lib/utils/url';

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

type QueueVerification = {
  id: string;
  evidenceUrl: string;
  createdAt: string;
  designer?: { name: string; avatarUrl: string | null };
};

type QueueReport = {
  id: string;
  targetType: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter: { name: string } | null;
  target: { label: string; href: string | null } | null;
};

type NewUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  createdAt: string;
};

const QUEUE_SIZE = 3;

export default function AdminOverviewPage() {
  const isAdmin = useIsAdmin();
  const stats = useApi<AdminStats>(isAdmin ? '/admin/stats' : null);
  const verifications = useApi<{ items: QueueVerification[] }>(
    isAdmin ? `/verifications/admin/pending?pageSize=${QUEUE_SIZE}` : null,
  );
  const reports = useApi<{ items: QueueReport[] }>(
    isAdmin ? `/admin/reports?pageSize=${QUEUE_SIZE}` : null,
  );
  const reviews = useApi<{ items: AdminReview[] }>(
    isAdmin ? `/admin/reviews?visibility=hidden&pageSize=${QUEUE_SIZE}` : null,
  );
  const newUsers = useApi<{ items: NewUser[] }>(
    isAdmin ? '/admin/users?pageSize=5' : null,
  );
  const activity = useApi<{ items: ActivityEntry[] }>(
    isAdmin ? '/admin/activity?pageSize=6' : null,
  );

  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
    report: QueueReport;
    action: 'resolve' | 'dismiss';
  } | null>(null);

  async function act(
    id: string,
    path: string,
    reload: () => void,
    body: unknown = {},
  ) {
    setActionError(null);
    setPending(id);
    try {
      await api.patch(path, body);
      reload();
      stats.reload();
      activity.reload();
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setPending(null);
    }
  }

  const data = stats.data;
  const hiddenReviews = reviews.data?.items ?? [];
  const queuesLoaded =
    !verifications.loading && !reports.loading && !reviews.loading;
  const nothingWaiting =
    queuesLoaded &&
    (verifications.data?.items.length ?? 0) === 0 &&
    (reports.data?.items.length ?? 0) === 0 &&
    hiddenReviews.length === 0;

  return (
    <AdminOnly>
      <PageHeader
        variant="app"
        eyebrow="Admin"
        title="Overview."
        description={
          data
            ? summary(data)
            : 'What needs a decision today, and how the platform is doing.'
        }
      />

      {stats.error ? (
        <div className="mt-6">
          <ErrorNotice message={stats.error} />
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          href="/admin/users"
          icon={Users}
          label="Users"
          value={data?.users}
          note={
            data
              ? `${data.clients} clients · ${data.designers} designers`
              : undefined
          }
        />
        <StatTile
          href="/admin/activity"
          icon={FolderKanban}
          label="Active projects"
          value={data?.activeProjects}
        />
        <StatTile
          href="/admin/users"
          icon={UserX}
          label="Suspended"
          value={data?.suspended}
        />
        <StatTile
          href="/admin/reports"
          icon={Inbox}
          label="Waiting on you"
          value={
            data
              ? data.pendingVerifications + data.openReports + data.hiddenReviews
              : undefined
          }
          urgent
        />
      </div>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Needs attention</h2>
        {actionError ? (
          <div className="mt-3">
            <ErrorNotice message={actionError} />
          </div>
        ) : null}

        {nothingWaiting ? (
          <div className="mt-3">
            <EmptyState
              title="All clear."
              description="No verifications, reports or hidden reviews are waiting."
            />
          </div>
        ) : (
          <div className="mt-3 grid gap-4 xl:grid-cols-3">
            <Queue
              title="Verifications"
              href="/admin/verifications"
              total={data?.pendingVerifications}
              loading={verifications.loading}
              error={verifications.error}
              empty="No designers waiting."
            >
              {verifications.data?.items.map((item) => (
                <QueueItem key={item.id}>
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={item.designer?.name ?? 'Designer'}
                      src={item.designer?.avatarUrl ?? null}
                      size={36}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {item.designer?.name ?? 'Designer'}
                      </p>
                      <p className="text-sm text-muted">
                        Submitted {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      disabled={pending === item.id}
                      onClick={() =>
                        act(
                          item.id,
                          `/verifications/${item.id}/approve`,
                          verifications.reload,
                        )
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending === item.id}
                      onClick={() =>
                        act(
                          item.id,
                          `/verifications/${item.id}/reject`,
                          verifications.reload,
                        )
                      }
                    >
                      Reject
                    </Button>
                    <a
                      href={safeHref(item.evidenceUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="link-underline text-sm"
                    >
                      Evidence
                    </a>
                  </div>
                </QueueItem>
              ))}
            </Queue>

            <Queue
              title="Reports"
              href="/admin/reports"
              total={data?.openReports}
              loading={reports.loading}
              error={reports.error}
              empty="No open reports."
            >
              {reports.data?.items.map((report) => (
                <QueueItem key={report.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {titleCase(report.targetType)} reported
                      </p>
                      {report.target ? (
                        report.target.href ? (
                          <Link
                            href={report.target.href}
                            target="_blank"
                            className="text-sm font-medium text-brand hover:underline"
                          >
                            {report.target.label}
                          </Link>
                        ) : (
                          <p className="text-sm font-medium">{report.target.label}</p>
                        )
                      ) : null}
                      <p className="text-sm text-muted">
                        {report.reporter ? `By ${report.reporter.name} · ` : ''}
                        {formatDate(report.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={report.status} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm">{report.reason}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={pending === report.id}
                      onClick={() => setConfirm({ report, action: 'resolve' })}
                    >
                      Resolve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending === report.id}
                      onClick={() => setConfirm({ report, action: 'dismiss' })}
                    >
                      Dismiss
                    </Button>
                  </div>
                </QueueItem>
              ))}
            </Queue>

            {confirm ? (
              <ConfirmDialog
                title={
                  confirm.action === 'resolve'
                    ? 'Resolve this report?'
                    : 'Dismiss this report?'
                }
                description={`${titleCase(confirm.report.targetType)} reported${confirm.report.target ? `: ${confirm.report.target.label}` : ''}. ${confirm.action === 'resolve' ? 'The reporter is told it was acted on.' : 'The reporter is told no action was needed.'}`}
                confirmLabel={confirm.action === 'resolve' ? 'Resolve' : 'Dismiss'}
                busy={pending === confirm.report.id}
                onConfirm={() =>
                  void act(
                    confirm.report.id,
                    `/admin/reports/${confirm.report.id}/${confirm.action}`,
                    reports.reload,
                  ).finally(() => setConfirm(null))
                }
                onCancel={() => setConfirm(null)}
              />
            ) : null}

            <Queue
              title="Hidden reviews"
              href="/admin/reviews"
              total={data?.hiddenReviews}
              loading={reviews.loading}
              error={reviews.error}
              empty="No hidden reviews."
            >
              {hiddenReviews.map((review) => (
                <QueueItem key={review.id}>
                  <p className="font-semibold">
                    {review.reviewer?.name ?? 'Client'} on{' '}
                    {review.designer?.name ?? 'designer'}
                  </p>
                  <Rating value={review.rating} className="mt-1" />
                  {review.comment ? (
                    <p className="mt-2 line-clamp-2 text-sm text-muted">
                      {review.comment}
                    </p>
                  ) : null}
                  <div className="mt-3">
                    <Button
                      size="sm"
                      disabled={pending === review.id}
                      onClick={() =>
                        act(
                          review.id,
                          `/admin/reviews/${review.id}/visibility`,
                          reviews.reload,
                          { isVisible: true },
                        )
                      }
                    >
                      Show review
                    </Button>
                  </div>
                </QueueItem>
              ))}
            </Queue>
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section>
          <SectionHeading title="Recent activity" href="/admin/activity" />
          <div className="mt-3">
            {activity.loading ? (
              <Skeleton className="h-48" />
            ) : activity.error ? (
              <ErrorNotice message={activity.error} />
            ) : activity.data && activity.data.items.length > 0 ? (
              <ul
                className={cn(
                  cardSurface,
                  'flex flex-col divide-y divide-hairline',
                )}
              >
                {activity.data.items.map((entry) => (
                  <ActivityRow key={entry.id} entry={entry} />
                ))}
              </ul>
            ) : (
              <EmptyState title="No activity yet." />
            )}
          </div>
        </section>

        <section>
          <SectionHeading title="Newest accounts" href="/admin/users" />
          <div className="mt-3">
            {newUsers.loading ? (
              <Skeleton className="h-48" />
            ) : newUsers.error ? (
              <ErrorNotice message={newUsers.error} />
            ) : newUsers.data && newUsers.data.items.length > 0 ? (
              <ul
                className={cn(
                  cardSurface,
                  'flex flex-col divide-y divide-hairline',
                )}
              >
                {newUsers.data.items.map((user) => (
                  <li key={user.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={user.name} src={user.avatarUrl} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{user.name}</p>
                      <p className="text-sm text-muted">
                        {titleCase(user.role)} · {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No accounts yet." />
            )}
          </div>
        </section>
      </div>
    </AdminOnly>
  );
}

function summary(data: AdminStats) {
  const waiting = [
    [data.pendingVerifications, 'verification'],
    [data.openReports, 'report'],
    [data.hiddenReviews, 'hidden review'],
  ]
    .filter(([count]) => Number(count) > 0)
    .map(([count, noun]) => `${count} ${noun}${count === 1 ? '' : 's'}`);
  return waiting.length > 0
    ? `Waiting on you: ${waiting.join(', ')}.`
    : 'Nothing is waiting on you right now.';
}

function SectionHeading({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <Link href={href} className="text-sm font-semibold text-brand hover:underline">
        View all
      </Link>
    </div>
  );
}

function Queue({
  title,
  href,
  total,
  loading,
  error,
  empty,
  children,
}: {
  title: string;
  href: string;
  total: number | undefined;
  loading: boolean;
  error: string | null;
  empty: string;
  children: ReactNode;
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  const hasItems = Array.isArray(items) ? items.length > 0 : Boolean(items);
  return (
    <div className={cn(cardSurface, 'flex flex-col overflow-hidden')}>
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-4">
        <p className="font-semibold">
          {title}
          {total !== undefined ? (
            <span className="ml-2 text-muted">{total}</span>
          ) : null}
        </p>
        <Link href={href} className="text-sm font-semibold text-brand hover:underline">
          View all
        </Link>
      </div>
      {loading ? (
        <Skeleton className="m-5 h-24" />
      ) : error ? (
        <div className="p-5">
          <ErrorNotice message={error} />
        </div>
      ) : hasItems ? (
        <ul className="flex flex-col divide-y divide-hairline">{items}</ul>
      ) : (
        <p className="px-5 py-6 text-sm text-muted">{empty}</p>
      )}
    </div>
  );
}

function QueueItem({ children }: { children: ReactNode }) {
  return <li className="px-5 py-3">{children}</li>;
}

function StatTile({
  href,
  icon: Icon,
  label,
  value,
  note,
  urgent = false,
}: {
  href: string;
  icon: LucideIcon;
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
        'group flex items-center gap-4 rounded-card p-5 transition-colors duration-300',
        highlighted
          ? 'bg-highlight-soft hover:bg-highlight-soft/70'
          : 'bg-sand hover:bg-brand-soft',
      )}
    >
      <span
        className={cn(
          'grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-canvas',
          highlighted ? 'text-status-action' : 'text-brand',
        )}
      >
        <Icon aria-hidden className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        {value === undefined ? (
          <Skeleton className="h-8 w-10 bg-canvas" />
        ) : (
          <span
            className={cn(
              'block font-display text-3xl font-semibold leading-none',
              highlighted ? 'text-status-action' : 'text-brand',
            )}
          >
            {value}
          </span>
        )}
        <span className="mt-1.5 block text-sm text-ink/70 group-hover:text-ink">
          {label}
        </span>
        {note ? <span className="block text-xs text-muted">{note}</span> : null}
      </span>
    </Link>
  );
}
