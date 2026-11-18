'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { UserPlus } from 'lucide-react';
import {
  downloadCsv,
  ExportButton,
  fetchAllPages,
} from '@/components/features/admin/admin-export';
import {
  AddUserDialog,
  exportUsersCsv,
  revokeButtonClass,
} from '@/components/features/admin/admin-users';
import { CONTACT_TOPICS } from '@/components/features/contact/contact-form';
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
import { PageHeader } from '@/components/ui/page-header';
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

export type Page<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  actions?: string[];
  categories?: string[];
  sellers?: string[];
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
export function useAdminList<T>(endpoint: string, filters: Record<string, string>) {
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

export function useAdminAction() {
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

export function Filters({ children }: { children: ReactNode }) {
  return (
    <FilterBar compact onSubmit={(event) => event.preventDefault()}>
      {children}
    </FilterBar>
  );
}

export function SearchField({
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

export function SelectField({
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

export function Results<T>({
  state,
  page,
  onPageChange,
  filtered,
  noun,
  empty,
  actionError,
  columns,
  children,
}: {
  state: { loading: boolean; error: string | null; data: Page<T> | null };
  page: number;
  onPageChange: (page: number) => void;
  filtered: boolean;
  noun: string;
  empty: string;
  actionError?: string | null;
  columns?: { className: string; labels: string[] };
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
            {columns ? (
              <div
                aria-hidden
                className={cn(
                  'hidden gap-x-4 border-b border-hairline bg-sand/40 px-5 py-2 text-label font-semibold uppercase text-muted md:px-6',
                  columns.className,
                )}
              >
                {columns.labels.map((label, index) => (
                  <span
                    key={label}
                    className={cn(index === columns.labels.length - 1 && 'text-right')}
                  >
                    {label}
                  </span>
                ))}
              </div>
            ) : null}
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

export const gridRow = 'grid gap-3 px-5 py-3 md:px-6';
const usersGrid =
  'md:grid md:grid-cols-[minmax(0,1fr)_6.5rem_6.5rem_6.5rem_15rem] md:items-center md:gap-x-4';
const reportsGrid =
  'lg:grid lg:grid-cols-[minmax(0,1fr)_10rem_6.5rem_7.5rem_22rem] lg:items-center lg:gap-x-4';
const reviewsGrid =
  'lg:grid lg:grid-cols-[minmax(0,1fr)_8.5rem_6.5rem_6.5rem_8rem] lg:items-center lg:gap-x-4';

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6">
      <PageHeader
        variant="app"
        eyebrow="Admin"
        title={title}
        description={description}
        action={action}
      />
    </div>
  );
}

export function UsersSection() {
  const { user: me } = useSession();
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const { list, search, setSearch, page, setPage, filtered } =
    useAdminList<AdminUser>('/admin/users', { role, status });
  const { error, pending, run } = useAdminAction();
  const [adding, setAdding] = useState(false);

  return (
    <>
      <SectionHeader
        title="Users."
        description="Every account on the platform. Suspend, reactivate or remove a verified badge."
        action={
          <div className="flex flex-wrap items-start gap-2">
            <ExportButton
              onExport={() =>
                exportUsersCsv({ search: search.trim(), role, status })
              }
            />
            <Button size="sm" onClick={() => setAdding(true)}>
              <UserPlus aria-hidden className="mr-1.5 h-4 w-4" />
              Add user
            </Button>
          </div>
        }
      />
      {adding ? (
        <AddUserDialog
          onClose={() => setAdding(false)}
          onCreated={() => {
            setAdding(false);
            void list.reload();
          }}
        />
      ) : null}

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
        columns={{
          className: usersGrid,
          labels: ['User', 'Role', 'Verified', 'Status', 'Actions'],
        }}
      >
        {(user) => (
          <li
            key={user.id}
            className={cn(gridRow, usersGrid, 'relative transition-colors hover:bg-sand/40')}
          >
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={user.name} src={user.avatarUrl} size={36} />
              <div className="min-w-0">
                <Link
                  href={`/admin/users/${user.id}`}
                  className="font-semibold after:absolute after:inset-0 hover:underline"
                >
                  {user.name}
                </Link>
                <p className="break-all text-sm text-muted">
                  {user.email} · Joined {formatDate(user.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 md:contents">
              <div>
                <Badge>{titleCase(user.role)}</Badge>
              </div>
              <div>
                {user.role === 'DESIGNER' && user.isVerified ? (
                  <Badge tone="support">Verified</Badge>
                ) : null}
              </div>
              <div>
                <StatusBadge status={user.status} />
              </div>
            </div>

            <div className="relative z-10 flex flex-wrap items-center gap-2 md:flex-nowrap md:justify-end">
              {user.role === 'DESIGNER' && user.isVerified ? (
                <Button
                  size="sm"
                  variant="outline"
                  className={revokeButtonClass}
                  disabled={pending === user.id}
                  onClick={() =>
                    run(
                      user.id,
                      `/admin/users/${user.id}/revoke-verification`,
                      list.reload,
                    )
                  }
                >
                  Revoke
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

const REMOVABLE: Record<string, string | undefined> = {
  PORTFOLIO: 'Also unpublish this portfolio',
  MESSAGE: 'Also hide this message',
  REVIEW: 'Also hide this review',
  USER: 'Also suspend this account',
};

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
  const [note, setNote] = useState('');
  const [removeContent, setRemoveContent] = useState(false);

  function openDecision(report: AdminReport, action: 'resolve' | 'dismiss') {
    setNote('');
    setRemoveContent(false);
    setConfirm({ report, action });
  }

  async function exportReports() {
    const items = await fetchAllPages<AdminReport>('/admin/reports', {
      search: search.trim(),
      status,
      targetType,
    });
    downloadCsv(
      'reports',
      ['Reported', 'Item', 'Reason', 'Details', 'Reporter', 'About', 'Status', 'Date'],
      items.map((report) => [
        titleCase(report.targetType),
        report.target?.label ?? '',
        report.reason,
        report.details ?? '',
        report.reporter?.name ?? '',
        report.reportedUser?.name ?? '',
        titleCase(report.status),
        report.createdAt.slice(0, 10),
      ]),
    );
  }

  return (
    <>
      <SectionHeader
        title="Reports."
        description="Reported people and content that still need a decision."
        action={<ExportButton onExport={exportReports} />}
      />
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
        columns={{
          className: reportsGrid,
          labels: ['Report', 'People', 'Date', 'Status', 'Actions'],
        }}
      >
        {(report) => (
          <li key={report.id} className={cn(gridRow, reportsGrid)}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <Badge>{titleCase(report.targetType)}</Badge>
                {report.target ? (
                  report.target.href ? (
                    <Link
                      href={report.target.href}
                      target="_blank"
                      className="font-semibold text-brand hover:underline"
                    >
                      {report.target.label}
                    </Link>
                  ) : (
                    <span className="font-semibold">{report.target.label}</span>
                  )
                ) : null}
              </div>
              <p className="mt-1.5">{report.reason}</p>
              {report.details ? (
                <p className="mt-0.5 line-clamp-2 text-sm text-muted">
                  {report.details}
                </p>
              ) : null}
            </div>

            <div className="text-sm">
              <p>
                <span className="text-muted">By </span>
                {report.reporter?.name ?? 'Unknown'}
              </p>
              {report.reportedUser ? (
                <p>
                  <span className="text-muted">About </span>
                  {report.reportedUser.name}
                </p>
              ) : null}
            </div>

            <p className="text-sm text-muted">{formatDate(report.createdAt)}</p>

            <div>
              <StatusBadge status={report.status} />
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-end">
              {report.status === 'OPEN' ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="whitespace-nowrap"
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
                onClick={() => openDecision(report, 'resolve')}
              >
                Resolve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending === report.id}
                onClick={() => openDecision(report, 'dismiss')}
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
              {
                note: note.trim() || undefined,
                ...(confirm.action === 'resolve' && removeContent
                  ? { removeContent: true }
                  : {}),
              },
            ).finally(() => setConfirm(null))
          }
          onCancel={() => setConfirm(null)}
        >
          <div className="mt-4 flex flex-col gap-3">
            <label htmlFor="report-note" className="text-sm font-semibold">
              Outcome note <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              id="report-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={1000}
              rows={3}
              className="rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm"
              placeholder="What you decided and why"
            />
            {confirm.action === 'resolve' &&
            REMOVABLE[confirm.report.targetType] ? (
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={removeContent}
                  onChange={(event) => setRemoveContent(event.target.checked)}
                  className="h-4 w-4 accent-brand"
                />
                {REMOVABLE[confirm.report.targetType]}
              </label>
            ) : null}
          </div>
        </ConfirmDialog>
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
        columns={{
          className: reviewsGrid,
          labels: ['Review', 'Rating', 'Date', 'Visibility', 'Actions'],
        }}
      >
        {(review) => (
          <li key={review.id} className={cn(gridRow, reviewsGrid)}>
            <div className="min-w-0">
              <p className="font-semibold">
                {review.reviewer?.name ?? 'Client'}
                <span className="font-normal text-muted"> on </span>
                {review.designer?.name ?? 'designer'}
              </p>
              {review.comment ? (
                <p className="mt-0.5 line-clamp-2 text-sm text-muted">
                  {review.comment}
                </p>
              ) : null}
            </div>

            <Rating value={review.rating} />

            <p className="text-sm text-muted">{formatDate(review.createdAt)}</p>

            <div>
              <Badge tone={review.isVisible ? 'support' : 'neutral'}>
                {review.isVisible ? 'Visible' : 'Hidden'}
              </Badge>
            </div>

            <div className="flex lg:justify-end">
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

  async function exportActivity() {
    const items = await fetchAllPages<ActivityEntry>('/admin/activity', {
      search: search.trim(),
      action,
    });
    downloadCsv(
      'activity',
      ['Event', 'Action', 'Person', 'Project', 'Date'],
      items.map((entry) => [
        describeActivity(entry),
        entry.action,
        entry.user?.name ?? 'System',
        entry.project?.title ?? '',
        entry.createdAt,
      ]),
    );
  }

  return (
    <>
      <SectionHeader
        title="Activity."
        description="What has happened across projects, plus the admin audit trail."
        action={<ExportButton onExport={exportActivity} />}
      />
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

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
};

const contactGrid =
  'lg:grid lg:grid-cols-[minmax(0,1fr)_9rem_6.5rem_7.5rem_13rem] lg:items-center lg:gap-x-4';

function topicLabel(topic: string) {
  return CONTACT_TOPICS.find((item) => item.value === topic)?.label ?? titleCase(topic);
}

export function ContactSection() {
  const [status, setStatus] = useState('');
  const [topic, setTopic] = useState('');
  const { list, search, setSearch, page, setPage, filtered } =
    useAdminList<ContactMessage>('/admin/contact', { status, topic });
  const { error, pending, run } = useAdminAction();
  const [expanded, setExpanded] = useState<string | null>(null);

  function setMessageStatus(item: ContactMessage, next: ContactMessage['status']) {
    return run(item.id, `/admin/contact/${item.id}/status`, list.reload, {
      status: next,
    });
  }

  function reply(item: ContactMessage) {
    const subject = encodeURIComponent(`Re: ${topicLabel(item.topic)} - Inside`);
    window.location.href = `mailto:${item.email}?subject=${subject}`;
    if (item.status === 'NEW') void setMessageStatus(item, 'IN_PROGRESS');
  }

  async function exportMessages() {
    const items = await fetchAllPages<ContactMessage>('/admin/contact', {
      search: search.trim(),
      status,
      topic,
    });
    downloadCsv(
      'contact-messages',
      ['Name', 'Email', 'Topic', 'Message', 'Status', 'Date'],
      items.map((item) => [
        item.name,
        item.email,
        topicLabel(item.topic),
        item.message,
        titleCase(item.status),
        item.createdAt.slice(0, 10),
      ]),
    );
  }

  return (
    <>
      <SectionHeader
        title="Contact."
        description="Messages sent through the public Contact us page."
        action={<ExportButton onExport={exportMessages} />}
      />
      <Filters>
        <SearchField
          id="contact-search"
          value={search}
          onChange={setSearch}
          placeholder="Name, email or message"
        />
        <SelectField
          id="contact-status"
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: '', label: 'Any status' },
            { value: 'NEW', label: 'New' },
            { value: 'IN_PROGRESS', label: 'In progress' },
            { value: 'RESOLVED', label: 'Resolved' },
          ]}
        />
        <SelectField
          id="contact-topic"
          label="Topic"
          value={topic}
          onChange={setTopic}
          options={[{ value: '', label: 'Any topic' }, ...CONTACT_TOPICS]}
        />
      </Filters>

      <Results
        state={list}
        page={page}
        onPageChange={setPage}
        filtered={filtered}
        noun="messages"
        empty="No messages yet."
        actionError={error}
        columns={{
          className: contactGrid,
          labels: ['Message', 'Topic', 'Date', 'Status', 'Actions'],
        }}
      >
        {(item) => {
          const open = expanded === item.id;
          const long = item.message.length > 160;
          return (
            <li key={item.id} className={cn(gridRow, contactGrid)}>
              <div className="min-w-0">
                <p className="font-semibold">
                  {item.name}
                  <span className="font-normal text-muted"> · {item.email}</span>
                </p>
                <p
                  className={cn(
                    'mt-0.5 whitespace-pre-line break-words text-sm text-muted',
                    !open && 'line-clamp-2',
                  )}
                >
                  {item.message}
                </p>
                {long ? (
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : item.id)}
                    className="mt-1 text-sm font-semibold text-brand hover:underline"
                  >
                    {open ? 'Show less' : 'Read more'}
                  </button>
                ) : null}
              </div>

              <p className="text-sm">{topicLabel(item.topic)}</p>

              <p className="text-sm text-muted">{formatDate(item.createdAt)}</p>

              <div>
                <StatusBadge status={item.status} />
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending === item.id}
                  onClick={() => reply(item)}
                >
                  Reply
                </Button>
                {item.status === 'RESOLVED' ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending === item.id}
                    onClick={() => void setMessageStatus(item, 'IN_PROGRESS')}
                  >
                    Reopen
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={pending === item.id}
                    onClick={() => void setMessageStatus(item, 'RESOLVED')}
                  >
                    Resolve
                  </Button>
                )}
              </div>
            </li>
          );
        }}
      </Results>
    </>
  );
}

type NewsletterSubscriber = { id: string; email: string; createdAt: string };

export function NewsletterSection() {
  const { list, search, setSearch, page, setPage, filtered } =
    useAdminList<NewsletterSubscriber>('/admin/newsletter', {});

  async function exportSubscribers() {
    const items = await fetchAllPages<NewsletterSubscriber>('/admin/newsletter', {
      search: search.trim(),
    });
    downloadCsv(
      'newsletter-subscribers',
      ['Email', 'Subscribed'],
      items.map((item) => [item.email, item.createdAt.slice(0, 10)]),
    );
  }

  return (
    <>
      <SectionHeader
        title="Newsletter."
        description="People who subscribed from the site footer."
        action={<ExportButton onExport={exportSubscribers} />}
      />
      <Filters>
        <SearchField
          id="newsletter-search"
          value={search}
          onChange={setSearch}
          placeholder="Email"
        />
      </Filters>
      <Results
        state={list}
        page={page}
        onPageChange={setPage}
        filtered={filtered}
        noun="subscribers"
        empty="No subscribers yet."
      >
        {(item) => (
          <li key={item.id} className={cn(gridRow, 'sm:grid-cols-[1fr_auto]')}>
            <p className="min-w-0 break-words font-semibold">{item.email}</p>
            <p className="text-sm text-muted">{formatDate(item.createdAt)}</p>
          </li>
        )}
      </Results>
    </>
  );
}
