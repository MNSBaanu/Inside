'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { describeActivity } from '@/components/features/projects/project-history';
import { useSession } from '@/components/providers/session-provider';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cardSurface } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { BareInput } from '@/components/ui/field';
import { FilterBar, FilterField } from '@/components/ui/filter-bar';
import { Pagination } from '@/components/ui/pagination';
import { Rating } from '@/components/ui/rating';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { api, errorMessage } from '@/lib/api/client';
import { useApi } from '@/lib/api/use-api';
import type {
  AccountStatus,
  ActivityEntry,
  AdminReview,
  ReportTargetType,
  Role,
  VerificationStatus,
} from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import { formatDate, titleCase } from '@/lib/utils/format';
import { safeHref } from '@/lib/utils/url';

const PAGE_SIZE = 20;

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
  target: { label: string; href: string | null } | null;
};

type PendingVerification = {
  id: string;
  evidenceUrl: string;
  notes: string | null;
  status: VerificationStatus;
  createdAt: string;
  designer?: { id: string; name: string; avatarUrl: string | null };
};

type Page<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  actions?: string[];
};

const REPORT_TARGETS: ReportTargetType[] = [
  'USER',
  'PROJECT',
  'PORTFOLIO',
  'REVIEW',
  'MESSAGE',
];

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

/** One page of an admin list, filtered and searched on the server. */
function useAdminList<T>(endpoint: string, filters: Record<string, string>) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filterKey = JSON.stringify(filters);
  useEffect(() => {
    setPage(1);
  }, [query, filterKey]);

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
  });
  if (query) params.set('search', query);
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }

  const list = useApi<Page<T>>(`${endpoint}?${params.toString()}`);
  const emptyPage = list.data !== null && list.data.items.length === 0;
  useEffect(() => {
    if (emptyPage && page > 1) setPage(page - 1);
  }, [emptyPage, page]);

  const filtered = query !== '' || Object.values(filters).some(Boolean);

  return { list, search, setSearch, page, setPage, filtered };
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
  page,
  onPageChange,
  filtered,
  noun,
  empty,
  actionError,
  children,
}: {
  state: { loading: boolean; error: string | null; data: Page<T> | null };
  page: number;
  onPageChange: (page: number) => void;
  filtered: boolean;
  noun: string;
  empty: string;
  actionError?: string | null;
  children: (item: T) => ReactNode;
}) {
  if (state.error) {
    return (
      <div className="mt-4">
        <ErrorNotice message={state.error} />
      </div>
    );
  }
  if (!state.data) return <Skeleton className="mt-4 h-64" />;

  const { items, total } = state.data;
  const first = (page - 1) * PAGE_SIZE + 1;
  const last = first + items.length - 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mt-4">
      {actionError ? (
        <div className="mb-4">
          <ErrorNotice message={actionError} />
        </div>
      ) : null}
      {total === 0 ? (
        <EmptyState title={filtered ? 'Nothing matches these filters.' : empty} />
      ) : (
        <>
          <div
            className={cn(
              cardSurface,
              'overflow-hidden transition-opacity duration-300',
              state.loading && 'opacity-60',
            )}
          >
            <p className="border-b border-hairline px-5 py-3 text-sm text-muted md:px-6">
              {total <= PAGE_SIZE
                ? `${total} ${noun}`
                : `${first}–${last} of ${total} ${noun}`}
            </p>
            <ul className="flex flex-col divide-y divide-hairline">
              {items.map(children)}
            </ul>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            label={`${titleCase(noun)} pages`}
          />
        </>
      )}
    </div>
  );
}

const rowClass =
  'flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-3 md:px-6';

export function UsersSection() {
  const { user: me } = useSession();
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const { list, search, setSearch, page, setPage, filtered } =
    useAdminList<AdminUser>('/admin/users', { role, status });
  const { error, pending, run } = useAdminAction();

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
        state={list}
        page={page}
        onPageChange={setPage}
        filtered={filtered}
        noun="users"
        empty="No users found."
        actionError={error}
      >
        {(user) => (
          <li key={user.id} className={rowClass}>
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={user.name} src={user.avatarUrl} size={36} />
              <div className="min-w-0">
                <p className="font-semibold">{user.name}</p>
                <p className="break-all text-sm text-muted">
                  {user.email} · Joined {formatDate(user.createdAt)}
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
                      list.reload,
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
                    run(user.id, `/admin/users/${user.id}/suspend`, list.reload)
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
                      list.reload,
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
  const { list, search, setSearch, page, setPage, filtered } =
    useAdminList<PendingVerification>('/verifications/admin/pending', {});
  const { error, pending, run } = useAdminAction();

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
        state={list}
        page={page}
        onPageChange={setPage}
        filtered={filtered}
        noun="awaiting review"
        empty="Nothing awaiting verification."
        actionError={error}
      >
        {(item) => (
          <li key={item.id} className={rowClass}>
            <div className="flex min-w-0 items-center gap-3">
              <Avatar
                name={item.designer?.name ?? 'Designer'}
                src={item.designer?.avatarUrl ?? null}
                size={36}
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
                  run(item.id, `/verifications/${item.id}/approve`, list.reload)
                }
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending === item.id}
                onClick={() =>
                  run(item.id, `/verifications/${item.id}/reject`, list.reload)
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
  const [status, setStatus] = useState('');
  const [targetType, setTargetType] = useState('');
  const { list, search, setSearch, page, setPage, filtered } =
    useAdminList<AdminReport>('/admin/reports', { status, targetType });
  const { error, pending, run } = useAdminAction();
  const [confirm, setConfirm] = useState<{
    report: AdminReport;
    action: 'resolve' | 'dismiss';
  } | null>(null);

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
          value={targetType}
          onChange={setTargetType}
          options={[
            { value: '', label: 'Anything' },
            ...REPORT_TARGETS.map((value) => ({
              value,
              label: titleCase(value),
            })),
          ]}
        />
      </Filters>

      <Results
        state={list}
        page={page}
        onPageChange={setPage}
        filtered={filtered}
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
                      list.reload,
                    )
                  }
                >
                  Take under review
                </Button>
              ) : null}
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
          </li>
        )}
      </Results>

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
            void run(
              confirm.report.id,
              `/admin/reports/${confirm.report.id}/${confirm.action}`,
              list.reload,
            ).finally(() => setConfirm(null))
          }
          onCancel={() => setConfirm(null)}
        />
      ) : null}
    </>
  );
}

export function ReviewsSection() {
  const [visibility, setVisibility] = useState('');
  const [rating, setRating] = useState('');
  const { list, search, setSearch, page, setPage, filtered } =
    useAdminList<AdminReview>('/admin/reviews', { visibility, rating });
  const { error, pending, run } = useAdminAction();

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
        state={list}
        page={page}
        onPageChange={setPage}
        filtered={filtered}
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
                    list.reload,
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
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3 md:px-6">
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
  const [action, setAction] = useState('');
  const { list, search, setSearch, page, setPage, filtered } =
    useAdminList<ActivityEntry>('/admin/activity', { action });
  const [actions, setActions] = useState<string[]>([]);

  useEffect(() => {
    if (list.data?.actions) setActions(list.data.actions);
  }, [list.data]);

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
        state={list}
        page={page}
        onPageChange={setPage}
        filtered={filtered}
        noun="events"
        empty="No activity yet."
      >
        {(entry) => <ActivityRow key={entry.id} entry={entry} />}
      </Results>
    </>
  );
}
