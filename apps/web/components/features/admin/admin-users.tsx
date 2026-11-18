'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { downloadCsv, fetchExport } from '@/components/features/admin/admin-export';
import { useSession } from '@/components/providers/session-provider';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cardSurface } from '@/components/ui/card';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { Field, Input } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { api, errorMessage } from '@/lib/api/client';
import { useApi } from '@/lib/api/use-api';
import type { AccountStatus, Role } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import { formatDate, titleCase } from '@/lib/utils/format';

export const revokeButtonClass =
  '!border-error/40 !text-error hover:!border-error hover:!bg-error hover:!text-canvas';

type ExportUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isVerified: boolean;
  status: AccountStatus;
  phone: string | null;
  location: string | null;
  createdAt: string;
};

export async function exportUsersCsv(filters: Record<string, string>) {
  const items = await fetchExport<ExportUser>('/admin/users/export', filters);
  const header = ['Name', 'Email', 'Role', 'Verified', 'Status', 'Phone', 'Location', 'Joined'];
  const rows = items.map((user) => [
    user.name,
    user.email,
    titleCase(user.role),
    user.isVerified ? 'Yes' : 'No',
    titleCase(user.status),
    user.phone ?? '',
    user.location ?? '',
    user.createdAt.slice(0, 10),
  ]);
  downloadCsv('users', header, rows);
}

export function AddUserDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CLIENT' | 'DESIGNER'>('CLIENT');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [busy, onClose]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post('/admin/users', { name, email, password, role });
      onCreated();
    } catch (cause) {
      setError(errorMessage(cause));
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/60 p-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-user-title"
        onSubmit={onSubmit}
        className="flex w-full max-w-md flex-col gap-4 rounded-card bg-surface p-6 shadow-lift"
      >
        <h2 id="add-user-title" className="font-display text-xl font-semibold">
          Add user
        </h2>
        {error ? <ErrorNotice message={error} /> : null}
        <Field label="Account type" htmlFor="new-user-role">
          <Select
            id="new-user-role"
            value={role}
            onChange={(value) => setRole(value as 'CLIENT' | 'DESIGNER')}
            options={[
              { value: 'CLIENT', label: 'Client' },
              { value: 'DESIGNER', label: 'Designer' },
            ]}
          />
        </Field>
        <Field label="Full name" htmlFor="new-user-name">
          <Input
            id="new-user-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            maxLength={100}
            autoFocus
          />
        </Field>
        <Field label="Email" htmlFor="new-user-email">
          <Input
            id="new-user-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="off"
          />
        </Field>
        <Field
          label="Password"
          htmlFor="new-user-password"
          hint="At least 8 characters, with a letter and a number. Share it with the user."
        >
          <PasswordInput
            id="new-user-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            maxLength={72}
            pattern="(?=.*[A-Za-z])(?=.*\d).+"
            autoComplete="new-password"
          />
        </Field>
        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create user'}
          </Button>
        </div>
      </form>
    </div>
  );
}

type AdminUserDetail = {
  id: string;
  name: string;
  email: string;
  role: Role;
  activeRole: Role;
  hasClientAccount: boolean;
  isVerified: boolean;
  isOwner: boolean;
  emailVerified: string | null;
  status: AccountStatus;
  bio: string | null;
  avatarUrl: string | null;
  phone: string | null;
  location: string | null;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    portfolios: number;
    projectsAsClient: number;
    projectsAsDesigner: number;
    reviewsReceived: number;
    reviewsWritten: number;
    reportsAgainst: number;
    reportsFiled: number;
    requestsMade: number;
    proposals: number;
    verificationsReviewed: number;
    reportsResolved: number;
    activityLogs: number;
  };
};

const USER_ACTIONS = {
  suspend: {
    title: 'Suspend',
    label: 'Suspend',
    description: 'They are signed out everywhere and cannot sign in until reactivated.',
    tone: 'danger',
  },
  reactivate: {
    title: 'Reactivate',
    label: 'Reactivate',
    description: 'They can sign in and use Inside again.',
    tone: 'default',
  },
  'revoke-verification': {
    title: 'Revoke verification for',
    label: 'Revoke',
    description: 'The verified badge is removed until they submit new evidence and it is approved.',
    tone: 'danger',
  },
  'make-admin': {
    title: 'Give admin access to',
    label: 'Make admin',
    description:
      'They get full access to the admin area. They are signed out and must sign in again. Their designer or client features are replaced by admin access.',
    tone: 'danger',
  },
  'remove-admin': {
    title: 'Remove admin access from',
    label: 'Remove admin',
    description:
      'They lose access to the admin area and become a client account. They are signed out and must sign in again.',
    tone: 'danger',
  },
} as const;

export function AdminUserDetail({ id }: { id: string }) {
  const { user: me } = useSession();
  const { data, error, reload } = useApi<{ user: AdminUserDetail }>(
    `/admin/users/${id}`,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { confirm, dialog } = useConfirm();

  async function run(action: keyof typeof USER_ACTIONS) {
    const name = data?.user.name ?? 'this user';
    const options = USER_ACTIONS[action];
    if (
      !(await confirm({
        title: `${options.title} ${name}?`,
        description: options.description,
        confirmLabel: options.label,
        tone: options.tone,
      }))
    ) {
      return;
    }
    setActionError(null);
    setPending(true);
    try {
      await api.patch(`/admin/users/${id}/${action}`, {});
      await reload();
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  if (error) return <ErrorNotice message={error} />;
  if (!data) return <Skeleton className="h-64" />;

  const user = data.user;
  const isDesigner = user.role === 'DESIGNER';
  const c = user._count;
  const counts =
    user.role === 'ADMIN'
      ? [
          { label: 'Verifications reviewed', value: c.verificationsReviewed },
          { label: 'Reports resolved', value: c.reportsResolved },
          { label: 'Actions logged', value: c.activityLogs },
        ]
      : isDesigner
        ? [
            { label: 'Portfolios', value: c.portfolios },
            { label: 'Proposals sent', value: c.proposals },
            { label: 'Projects', value: c.projectsAsDesigner },
            { label: 'Reviews received', value: c.reviewsReceived },
            { label: 'Reports against', value: c.reportsAgainst },
          ]
        : [
            { label: 'Requests posted', value: c.requestsMade },
            { label: 'Projects', value: c.projectsAsClient },
            { label: 'Reviews written', value: c.reviewsWritten },
            { label: 'Reports filed', value: c.reportsFiled },
            { label: 'Reports against', value: c.reportsAgainst },
          ];

  const details = [
    { label: 'Email', value: user.email },
    { label: 'Email confirmed', value: user.emailVerified ? formatDate(user.emailVerified) : 'Not yet' },
    { label: 'Phone', value: user.phone ?? '—' },
    { label: 'Location', value: user.location ?? '—' },
    { label: 'Joined', value: formatDate(user.createdAt) },
    { label: 'Last updated', value: formatDate(user.updatedAt) },
    ...(isDesigner
      ? [
          { label: 'Taking new work', value: user.isAvailable ? 'Yes' : 'No' },
          { label: 'Also a client', value: user.hasClientAccount ? 'Yes' : 'No' },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      {dialog}
      {actionError ? <ErrorNotice message={actionError} /> : null}

      <section className={cn(cardSurface, 'flex flex-wrap items-center justify-between gap-4 p-5 md:p-6')}>
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={user.name} src={user.avatarUrl} size={56} />
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-semibold">{user.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge>{titleCase(user.role)}</Badge>
              {user.isOwner ? <Badge tone="support">Owner</Badge> : null}
              {isDesigner && user.isVerified ? (
                <Badge tone="support">Verified</Badge>
              ) : null}
              <StatusBadge status={user.status} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isDesigner && user.isVerified ? (
            <Button
              size="sm"
              variant="outline"
              className={revokeButtonClass}
              disabled={pending}
              onClick={() => run('revoke-verification')}
            >
              Revoke
            </Button>
          ) : null}
          {me?.isOwner && !user.isOwner && user.role === 'ADMIN' ? (
            <Button
              size="sm"
              variant="outline"
              className={revokeButtonClass}
              disabled={pending}
              onClick={() => run('remove-admin')}
            >
              Remove admin
            </Button>
          ) : null}
          {me?.isOwner && user.role !== 'ADMIN' && user.status === 'ACTIVE' ? (
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => run('make-admin')}
            >
              Make admin
            </Button>
          ) : null}
          {user.id === me?.id ||
          user.isOwner ||
          (user.role === 'ADMIN' && !me?.isOwner) ? null : user.status === 'ACTIVE' ? (
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => run('suspend')}
            >
              Suspend
            </Button>
          ) : (
            <Button size="sm" disabled={pending} onClick={() => run('reactivate')}>
              Reactivate
            </Button>
          )}
        </div>
      </section>

      <section
        className={cn(
          'grid grid-cols-2 gap-3 md:grid-cols-3',
          counts.length === 5 && 'xl:grid-cols-5',
        )}
      >
        {counts.map((item) => (
          <div key={item.label} className={cn(cardSurface, 'p-4')}>
            <p className="font-display text-2xl font-semibold">{item.value}</p>
            <p className="mt-1 text-sm text-muted">{item.label}</p>
          </div>
        ))}
      </section>

      <section className={cn(cardSurface, 'p-5 md:p-6')}>
        <h3 className="font-semibold">Account</h3>
        <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {details.map((item) => (
            <div key={item.label}>
              <dt className="text-label font-semibold uppercase text-muted">{item.label}</dt>
              <dd className="mt-0.5 break-all">{item.value}</dd>
            </div>
          ))}
        </dl>
        {user.bio ? (
          <>
            <h3 className="mt-6 font-semibold">Bio</h3>
            <p className="mt-2 whitespace-pre-line text-muted">{user.bio}</p>
          </>
        ) : null}
      </section>
    </div>
  );
}
