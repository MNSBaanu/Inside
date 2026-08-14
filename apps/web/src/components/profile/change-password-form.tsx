'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InlineAlert } from '@/components/layout/inline-alert';
import { changePasswordRequest, formatApiError } from '@/lib/api/auth';

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirm) {
      setError('New passwords do not match.');
      return;
    }
    setPending(true);
    try {
      await changePasswordRequest({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
      setMessage('Password updated. Other sessions were signed out.');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="surface-panel flex flex-col gap-4 p-5 md:p-6"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-9 place-items-center rounded-xl border border-primary/15 bg-primary/[0.07] text-primary"
        >
          <Lock className="size-4" />
        </span>
        <div>
          <h2 className="font-heading text-xl tracking-tight">
            Change password
          </h2>
          <p className="text-sm text-muted-foreground">
            Updating signs out your other sessions.
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
      {message ? <InlineAlert tone="success">{message}</InlineAlert> : null}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? 'Updating…' : 'Update password'}
      </Button>
    </form>
  );
}
