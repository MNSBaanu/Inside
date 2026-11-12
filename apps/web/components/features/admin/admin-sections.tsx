'use client';

import { useState, type ReactNode } from 'react';
import { describeActivity } from '@/components/features/projects/project-history';
import { useSession } from '@/components/providers/session-provider';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cardSurface } from '@/components/ui/card';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { BareInput } from '@/components/ui/field';
import { FilterBar, FilterField } from '@/components/ui/filter-bar';
import { Rating } from '@/components/ui/rating';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { api, errorMessage } from '@/lib/api/client';
import { useApi } from '@/lib/api/use-api';
import type {
  AccountStatus,
  ActivityEntry,
  AdminReview,
  Role,
  VerificationStatus,
} from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import { formatDate, titleCase } from '@/lib/utils/format';
import { safeHref } from '@/lib/utils/url';

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
  targetType: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reporter: { id: string; name: string } | null;
  reportedUser: { id: string; name: string } | null;
};

type PendingVerification = {
  id: string;
  evidenceUrl: string;
  notes: string | null;
  status: VerificationStatus;
  createdAt: string;
  designer?: { id: string; name: string; avatarUrl: string | null };
};

export function useIsAdmin() {
  const { user } = useSession();
  return user?.role === 'ADMIN';
}

export function AdminOnly({ children }: { children: ReactNode }) {
  if (!useIsAdmin()) {
    return (
      <EmptyState
        title="Admins only."
        description="This area is for platform administrators."
      />
    );
  }
  return <>{children}</>;
}

function useAdminAction() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function run(
    id: string,
    path: string,
    reload: () => void,
    body: unknown = {},
  ) {
    setError(null);
    setPending(id);
    try {
      await api.patch(path, body);
      reload();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setPending(null);
    }
  }

  return { error, pending, run };
}

const matches = (query: string, ...values: (string | null | undefined)[]) => {
  const needle = query.trim().toLowerCase();
  return (
    needle === '' ||
    values.some((value) => value?.toLowerCase().includes(needle))
  );
};

function Filters({ children }: { children: ReactNode }) {
  return (
    <FilterBar onSubmit={(event) => event.preventDefault()}>
      {children}
    </FilterBar>
  );
}

function SearchField({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <FilterField label="Search" htmlFor={id}>
      <BareInput
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
    </FilterField>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <FilterField label={label} htmlFor={id}>
      <Select bare id={id} value={value} options={options} onChange={onChange} />
    </FilterField>
  );
}

function Results<T>({
  state,
  items,
  noun,
  empty,
  actionError,
  children,
}: {
  state: { loading: boolean; error: string | null; data: { items: T[] } | null };
  items: T[];
  noun: string;
  empty: string;
  actionError?: string | null;
  children: (item: T) => ReactNode;
}) {
  if (state.loading) return <Skeleton className="mt-8 h-64" />;
  if (state.error) {
    return (
      <div className="mt-8">
        <ErrorNotice message={state.error} />
      </div>
    );
  }
  const total = state.data?.items.length ?? 0;
  return (
    <div className="mt-8">
      {actionError ? (
        <div className="mb-6">
          <ErrorNotice message={actionError} />
        </div>
      ) : null}
      {items.length === 0 ? (
        <EmptyState
          title={total === 0 ? empty : 'Nothing matches these filters.'}
        />
      ) : (
        <div className={cn(cardSurface, 'overflow-hidden')}>
          <p className="border-b border-hairline px-5 py-4 text-sm text-muted md:px-6">
            {items.length === total
              ? `${total} ${noun}`
              : `${items.length} of ${total} ${noun}`}
          </p>
          <ul className="flex flex-col divide-y divide-hairline">
            {items.map(children)}
          </ul>
        </div>
      )}
    </div>
  );
}

const rowClass =
  'flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-5 py-5 md:px-6';

export function UsersSection() {
  const { user: me } = useSession();
  const users = useApi<{ items: AdminUser[] }>('/admin/users');
  const { error, pending, run } = useAdminAction();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');

  const items = (users.data?.items ?? []).filter(
    (user) =>
      matches(search, user.name, user.email) &&
      (role === '' || user.role === role) &&
      (status === '' || user.status === status),
  );

  return (
    <>
      <Filters>
        <SearchField
          id="user-search"
          value={search}
          onChange={setSearch}
          placeholder="Name or email"
        />
        <SelectField
          id="user-role"
          label="Role"
          value={role}
          onChange={setRole}
          options={[
            { value: '', label: 'All roles' },
            { value: 'CLIENT', label: 'Clients' },
            { value: 'DESIGNER', label: 'Designers' },
            { value: 'ADMIN', label: 'Admins' },
          ]}
        />
        <SelectField
          id="user-status"
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: '', label: 'Any status' },
            { value: 'ACTIVE', label: 'Active' },
            { value: 'SUSPENDED', label: 'Suspended' },
          ]}
        />
      </Filters>

      <Results
        state={users}
        items={items}
        noun="users"
        empty="No users found."
        actionError={error}
      >
        {(user) => (
          <li key={user.id} className={rowClass}>
            <div className="flex min-w-0 items-center gap-4">
              <Avatar name={user.name} src={user.avatarUrl} size={44} />
              <div className="min-w-0">
                <p className="font-semibold">{user.name}</p>
                <p className="break-all text-sm text-muted">{user.email}</p>
                <p className="text-sm text-muted">
                  Joined {formatDate(user.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge>{titleCase(user.role)}</Badge>
              {user.role === 'DESIGNER' && user.isVerified ? (
                <Badge tone="support">Verified</Badge>
              ) : null}
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
              {user.id === me?.id ? null : user.status === 'ACTIVE' ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending === user.id}
                  onClick={() =>
                    run(user.id, `/admin/users/${user.id}/suspend`, users.reload)
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
        )}
      </Results>
    </>
  );
}

export function VerificationsSection() {
  const verifications = useApi<{ items: PendingVerification[] }>(
    '/verifications/admin/pending',
  );
  const { error, pending, run } = useAdminAction();
  const [search, setSearch] = useState('');

  const items = (verifications.data?.items ?? []).filter((item) =>
    matches(search, item.designer?.name, item.notes),
  );

  return (
    <>
      <Filters>
        <SearchField
          id="verification-search"
          value={search}
          onChange={setSearch}
          placeholder="Designer name or notes"
        />
      </Filters>

      <Results
        state={verifications}
        items={items}
        noun="awaiting review"
        empty="Nothing awaiting verification."
        actionError={error}
      >
        {(item) => (
          <li key={item.id} className={rowClass}>
            <div className="flex min-w-0 items-center gap-4">
              <Avatar
                name={item.designer?.name ?? 'Designer'}
                src={item.designer?.avatarUrl ?? null}
                size={44}
              />
              <div className="min-w-0">
                <p className="font-semibold">
                  {item.designer?.name ?? 'Designer'}
                </p>
                <p className="text-sm text-muted">
                  Submitted {formatDate(item.createdAt)}
                </p>
                {item.notes ? (
                  <p className="mt-1 text-sm text-muted">{item.notes}</p>
                ) : null}
                <a
                  href={safeHref(item.evidenceUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="link-underline mt-1 inline-block text-sm"
                >
                  View evidence
                </a>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={item.status} />
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
        )}
      </Results>
    </>
  );
}

export function ReportsSection() {
  const reports = useApi<{ items: AdminReport[] }>('/admin/reports');
  const { error, pending, run } = useAdminAction();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');

  const all = reports.data?.items ?? [];
  const types = [...new Set(all.map((report) => report.targetType))];
  const items = all.filter(
    (report) =>
      matches(
        search,
        report.reason,
        report.details,
        report.reporter?.name,
        report.reportedUser?.name,
      ) &&
      (status === '' || report.status === status) &&
      (type === '' || report.targetType === type),
  );

  return (
    <>
      <Filters>
        <SearchField
          id="report-search"
          value={search}
          onChange={setSearch}
          placeholder="Reason or person"
        />
        <SelectField
          id="report-status"
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: '', label: 'Open and under review' },
            { value: 'OPEN', label: 'Open' },
            { value: 'UNDER_REVIEW', label: 'Under review' },
          ]}
        />
        <SelectField
          id="report-type"
          label="Reported"
          value={type}
          onChange={setType}
          options={[
            { value: '', label: 'Anything' },
            ...types.map((value) => ({ value, label: titleCase(value) })),
          ]}
        />
      </Filters>

      <Results
        state={reports}
        items={items}
        noun="reports"
        empty="No open reports."
        actionError={error}
      >
        {(report) => (
          <li key={report.id} className={rowClass}>
            <div className="min-w-0 max-w-xl">
              <p className="font-semibold">
                {titleCase(report.targetType)} reported
              </p>
              <p className="text-sm text-muted">
                {report.reporter ? `By ${report.reporter.name}` : 'Reporter'}
                {report.reportedUser
                  ? ` · about ${report.reportedUser.name}`
                  : ''}
                {` · ${formatDate(report.createdAt)}`}
              </p>
              <p className="mt-2">{report.reason}</p>
              {report.details ? (
                <p className="mt-1 text-sm text-muted">{report.details}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={report.status} />
              {report.status === 'OPEN' ? (
                <Button
                  size="sm"
                  variant="ghost"
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
        )}
      </Results>
    </>
  );
}

export function ReviewsSection() {
  const reviews = useApi<{ items: AdminReview[] }>('/admin/reviews');
  const { error, pending, run } = useAdminAction();
  const [search, setSearch] = useState('');
  const [visibility, setVisibility] = useState('');
  const [rating, setRating] = useState('');

  const items = (reviews.data?.items ?? []).filter(
    (review) =>
      matches(
        search,
        review.reviewer?.name,
        review.designer?.name,
        review.comment,
      ) &&
      (visibility === '' ||
        (visibility === 'visible') === review.isVisible) &&
      (rating === '' || review.rating === Number(rating)),
  );

  return (
    <>
      <Filters>
        <SearchField
          id="review-search"
          value={search}
          onChange={setSearch}
          placeholder="Client, designer or comment"
        />
        <SelectField
          id="review-visibility"
          label="Visibility"
          value={visibility}
          onChange={setVisibility}
          options={[
            { value: '', label: 'All reviews' },
            { value: 'hidden', label: 'Hidden' },
            { value: 'visible', label: 'Visible' },
          ]}
        />
        <SelectField
          id="review-rating"
          label="Rating"
          value={rating}
          onChange={setRating}
          options={[
            { value: '', label: 'Any rating' },
            ...[5, 4, 3, 2, 1].map((stars) => ({
              value: String(stars),
              label: `${stars} star${stars === 1 ? '' : 's'}`,
            })),
          ]}
        />
      </Filters>

      <Results
        state={reviews}
        items={items}
        noun="reviews"
        empty="No reviews yet."
        actionError={error}
      >
        {(review) => (
          <li key={review.id} className={rowClass}>
            <div className="min-w-0 max-w-xl">
              <p className="font-semibold">
                {review.reviewer?.name ?? 'Client'} on{' '}
                {review.designer?.name ?? 'designer'}
              </p>
              <p className="text-sm text-muted">
                {formatDate(review.createdAt)}
              </p>
              <Rating value={review.rating} className="mt-2" />
              {review.comment ? (
                <p className="mt-2 text-muted">{review.comment}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={review.isVisible ? 'support' : 'neutral'}>
                {review.isVisible ? 'Visible' : 'Hidden'}
              </Badge>
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
        )}
      </Results>
    </>
  );
}

export function ActivityRow({ entry }: { entry: ActivityEntry }) {
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-4 md:px-6">
      <div className="min-w-0">
        <p className="font-semibold first-letter:uppercase">
          {describeActivity(entry)}
        </p>
        <p className="mt-1 break-words text-sm text-muted">
          {entry.user?.name ?? 'System'}
          {entry.project ? ` · ${entry.project.title}` : ''}
        </p>
      </div>
      <p className="text-sm text-muted">{formatDate(entry.createdAt)}</p>
    </li>
  );
}

export function ActivitySection() {
  const activity = useApi<{ items: ActivityEntry[] }>(
    '/admin/activity?pageSize=100',
  );
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');

  const all = activity.data?.items ?? [];
  const actions = [...new Set(all.map((entry) => entry.action))].sort();
  const items = all.filter(
    (entry) =>
      matches(
        search,
        describeActivity(entry),
        entry.user?.name,
        entry.project?.title,
      ) &&
      (action === '' || entry.action === action),
  );

  return (
    <>
      <Filters>
        <SearchField
          id="activity-search"
          value={search}
          onChange={setSearch}
          placeholder="Person, project or event"
        />
        <SelectField
          id="activity-action"
          label="Event"
          value={action}
          onChange={setAction}
          options={[
            { value: '', label: 'All events' },
            ...actions.map((value) => ({ value, label: titleCase(value) })),
          ]}
        />
      </Filters>

      <Results
        state={activity}
        items={items}
        noun="recent events"
        empty="No activity yet."
      >
        {(entry) => <ActivityRow key={entry.id} entry={entry} />}
      </Results>
    </>
  );
}
