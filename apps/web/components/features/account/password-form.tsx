'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import { ErrorNotice } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api/client';

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      await api.patch('/users/me/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setSaved(true);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Change password" />

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        {error ? <ErrorNotice message={error} /> : null}
        {saved ? (
          <p className="rounded-card bg-support-soft px-4 py-3 text-sm text-success">
            Password updated.
          </p>
        ) : null}

        <Field label="Current password" htmlFor="currentPassword">
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </Field>

        <Field
          label="New password"
          htmlFor="newPassword"
          hint="At least 8 characters."
        >
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </Field>

        <div>
          <Button type="submit" size="lg" disabled={busy}>
            {busy ? 'Updating…' : 'Update password'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
