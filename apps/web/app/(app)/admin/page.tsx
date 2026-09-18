'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { Rating } from '@/components/ui/rating';
import { describeActivity } from '@/components/projects/project-history';
import { StatusBadge } from '@/components/ui/status-badge';
import { api, errorMessage } from '@/lib/api';
import { formatDate, titleCase } from '@/lib/format';
import { safeHref } from '@/lib/url';
import { useApi } from '@/lib/use-api';
import { cn } from '@/lib/cn';
import type {
  AccountStatus,
  ActivityEntry,
  AdminReview,
  Role,
  VerificationStatus,
} from '@/lib/types';

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: AccountStatus;
  isVerified: boolean;
  avatarUrl: string | null;
  createdAt: string;
};

type AdminReport = {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
};

type PendingVerification = {
  id: string;
  designerId: string;
  evidenceUrl: string;
  notes: string | null;
  status: VerificationStatus;
  createdAt: string;
  designer?: { id: string; name: string; avatarUrl: string | null };
};

const tabs = [
  'Users',
  'Verifications',
  'Reports',
  'Reviews',
  'Activity',
] as const;
type Tab = (typeof tabs)[number];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('Users');
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const users = useApi<{ items: AdminUser[] }>('/admin/users');
  const verifications = useApi<{ items: PendingVerification[] }>(
    '/verifications/admin/pending',
  );
  const reports = useApi<{ items: AdminReport[] }>('/admin/reports');
  const reviews = useApi<{ items: AdminReview[] }>('/admin/reviews');
  const activity = useApi<{ items: ActivityEntry[] }>('/admin/activity');

  async function run(
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
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setPending(null);
    }
  }

  return (
    <div>
      <Badge tone="brand">Admin</Badge>
      <h1 className="mt-6 font-display text-section font-semibold">
        Moderation.
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        Accounts, designer verification, reported content, reviews and
        platform activity.
      </p>

      {actionError ? (
        <div className="mt-8">
          <ErrorNotice message={actionError} />
        </div>
      ) : null}

      <div
        role="tablist"
        aria-label="Admin sections"
        className="mt-12 flex gap-2 overflow-x-auto border-b border-hairline"
      >
        {tabs.map((name) => (
          <button
            key={name}
            role="tab"
            type="button"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 px-5 py-3 text-label font-semibold uppercase transition-colors duration-300',
              tab === name
                ? 'border-brand text-brand'
                : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === 'Users' ? (
          users.loading ? (
            <Skeleton className="h-48" />
          ) : users.error ? (
            <ErrorNotice message={users.error} />
          ) : users.data && users.data.items.length > 0 ? (
            <ul className="flex flex-col gap-4">
              {users.data.items.map((user) => (
                <li
                  key={user.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-hairline bg-surface p-6"
                >
                  <div className="flex items-center gap-4">
                    <Avatar name={user.name} src={user.avatarUrl} size={48} />
                    <div>
                      <p className="font-display text-xl font-semibold">
                        {user.name}
                      </p>
                      <p className="text-sm text-muted">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Badge>{titleCase(user.role)}</Badge>
                    <StatusBadge status={user.status} />
                    {user.role === 'DESIGNER' && user.isVerified ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending === user.id}
                        onClick={() =>
                          run(
                            user.id,
                            `/admin/users/${user.id}/revoke-verification`,
                            users.reload,
                          )
                        }
                      >
                        Revoke badge
                      </Button>
                    ) : null}
                    {user.status === 'ACTIVE' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending === user.id}
                        onClick={() =>
                          run(
                            user.id,
                            `/admin/users/${user.id}/suspend`,
                            users.reload,
                          )
                        }
                      >
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={pending === user.id}
                        onClick={() =>
                          run(
                            user.id,
                            `/admin/users/${user.id}/reactivate`,
                            users.reload,
                          )
                        }
                      >
                        Reactivate
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No users found." />
          )
        ) : null}

        {tab === 'Verifications' ? (
          verifications.loading ? (
            <Skeleton className="h-48" />
          ) : verifications.error ? (
            <ErrorNotice message={verifications.error} />
          ) : verifications.data && verifications.data.items.length > 0 ? (
            <ul className="flex flex-col gap-4">
              {verifications.data.items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-card border border-hairline bg-surface p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-display text-xl font-semibold">
                        {item.designer?.name ?? 'Designer'}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Submitted {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  <a
                    href={safeHref(item.evidenceUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="link-underline mt-4 inline-block"
                  >
                    View evidence
                  </a>

                  {item.notes ? (
                    <p className="mt-3 text-muted">{item.notes}</p>
                  ) : null}

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button
                      size="sm"
                      disabled={pending === item.id}
                      onClick={() =>
                        run(
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
                        run(
                          item.id,
                          `/verifications/${item.id}/reject`,
                          verifications.reload,
                        )
                      }
                    >
                      Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nothing awaiting verification." />
          )
        ) : null}

        {tab === 'Reports' ? (
          reports.loading ? (
            <Skeleton className="h-48" />
          ) : reports.error ? (
            <ErrorNotice message={reports.error} />
          ) : reports.data && reports.data.items.length > 0 ? (
            <ul className="flex flex-col gap-4">
              {reports.data.items.map((report) => (
                <li
                  key={report.id}
                  className="rounded-card border border-hairline bg-surface p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-display text-xl font-semibold">
                        {titleCase(report.targetType)} reported
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {formatDate(report.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={report.status} />
                  </div>

                  <p className="mt-4 text-muted">{report.reason}</p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {report.status === 'OPEN' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending === report.id}
                        onClick={() =>
                          run(
                            report.id,
                            `/admin/reports/${report.id}/under-review`,
                            reports.reload,
                          )
                        }
                      >
                        Take under review
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      disabled={pending === report.id}
                      onClick={() =>
                        run(
                          report.id,
                          `/admin/reports/${report.id}/resolve`,
                          reports.reload,
                        )
                      }
                    >
                      Resolve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending === report.id}
                      onClick={() =>
                        run(
                          report.id,
                          `/admin/reports/${report.id}/dismiss`,
                          reports.reload,
                        )
                      }
                    >
                      Dismiss
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No open reports." />
          )
        ) : null}

        {tab === 'Reviews' ? (
          reviews.loading ? (
            <Skeleton className="h-48" />
          ) : reviews.error ? (
            <ErrorNotice message={reviews.error} />
          ) : reviews.data && reviews.data.items.length > 0 ? (
            <ul className="flex flex-col gap-4">
              {reviews.data.items.map((review) => (
                <li
                  key={review.id}
                  className="rounded-card border border-hairline bg-surface p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-display text-xl font-semibold">
                        {review.reviewer?.name ?? 'Client'} on{' '}
                        {review.designer?.name ?? 'designer'}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                    <Badge tone={review.isVisible ? 'support' : 'neutral'}>
                      {review.isVisible ? 'Visible' : 'Hidden'}
                    </Badge>
                  </div>

                  <Rating value={review.rating} className="mt-4" />

                  {review.comment ? (
                    <p className="mt-3 text-muted">{review.comment}</p>
                  ) : null}

                  <div className="mt-6">
                    <Button
                      size="sm"
                      variant={review.isVisible ? 'outline' : 'primary'}
                      disabled={pending === review.id}
                      onClick={() =>
                        run(
                          review.id,
                          `/admin/reviews/${review.id}/visibility`,
                          reviews.reload,
                          { isVisible: !review.isVisible },
                        )
                      }
                    >
                      {review.isVisible ? 'Hide review' : 'Show review'}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No reviews yet." />
          )
        ) : null}

        {tab === 'Activity' ? (
          activity.loading ? (
            <Skeleton className="h-48" />
          ) : activity.error ? (
            <ErrorNotice message={activity.error} />
          ) : activity.data && activity.data.items.length > 0 ? (
            <ul className="flex flex-col divide-y divide-hairline rounded-card border border-hairline bg-surface">
              {activity.data.items.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 p-5"
                >
                  <div className="min-w-0">
                    <p className="font-semibold first-letter:uppercase">
                      {describeActivity(entry)}
                    </p>
                    <p className="mt-1 break-words text-sm text-muted">
                      {entry.user?.name ?? 'System'}
                      {entry.project ? ` · ${entry.project.title}` : ''}
                    </p>
                  </div>
                  <p className="text-sm text-muted">
                    {formatDate(entry.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No activity yet." />
          )
        ) : null}
      </div>
    </div>
  );
}
