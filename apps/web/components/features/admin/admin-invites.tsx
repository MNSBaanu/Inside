'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { cardSurface } from '@/components/ui/card';
import { ErrorNotice } from '@/components/ui/feedback';
import { Field, Input } from '@/components/ui/field';
import { api, errorMessage } from '@/lib/api/client';
import { useApi } from '@/lib/api/use-api';
import { formatDate } from '@/lib/utils/format';

type Invite = { id: string; email: string; expiresAt: string; createdAt: string };

export function InviteAdminDialog({
  onClose,
  onInvited,
}: {
  onClose: () => void;
  onInvited: () => void;
}) {
  const [email, setEmail] = useState('');
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
      const result = await api.post<{ emailSent: boolean }>('/admin/invites', { email });
      if (!result.emailSent) {
        setError('The invite was created but the email could not be sent. Revoke it and try again.');
        setBusy(false);
        onInvited();
        return;
      }
      onInvited();
      onClose();
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
        aria-labelledby="invite-admin-title"
        onSubmit={onSubmit}
        className="flex w-full max-w-md flex-col gap-4 rounded-card bg-surface p-6 shadow-lift"
      >
        <h2 id="invite-admin-title" className="font-display text-xl font-semibold">
          Invite an admin
        </h2>
        <p className="text-sm text-muted">
          We email them a link that works once and expires in 7 days. They sign in
          or sign up with this email address, then accept.
        </p>
        {error ? <ErrorNotice message={error} /> : null}
        <Field label="Email" htmlFor="invite-admin-email">
          <Input
            id="invite-admin-email"
            type="email"
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="off"
            autoFocus
          />
        </Field>
        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send invite'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function PendingInvites() {
  const { data, error, reload } = useApi<{ items: Invite[] }>('/admin/invites');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function revoke(id: string) {
    setActionError(null);
    setBusyId(id);
    try {
      await api.delete(`/admin/invites/${id}`);
      await reload();
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setBusyId(null);
    }
  }

  if (error || !data || data.items.length === 0) return null;

  return (
    <section className={`${cardSurface} mb-6 p-5`}>
      <h2 className="font-display text-lg font-semibold">Pending admin invites</h2>
      {actionError ? (
        <div className="mt-3">
          <ErrorNotice message={actionError} />
        </div>
      ) : null}
      <ul className="mt-3 divide-y divide-ink/10">
        {data.items.map((invite) => (
          <li key={invite.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm font-medium">{invite.email}</p>
              <p className="text-xs text-muted">
                Expires {formatDate(invite.expiresAt)}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={busyId === invite.id}
              onClick={() => void revoke(invite.id)}
            >
              Revoke
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
