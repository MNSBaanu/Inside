'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InlineAlert } from '@/components/layout/inline-alert';
import { formatApiError, resetPasswordRequest } from '@/lib/api/auth';
import { cn } from '@/lib/utils';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (token.trim().length < 20) {
      setError('Paste a valid reset token.');
      return;
    }
    setPending(true);
    try {
      await resetPasswordRequest(token.trim(), password);
      setDone(true);
      setTimeout(() => router.replace('/login'), 1500);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <InlineAlert tone="success">
        Password updated. Redirecting to log in…
      </InlineAlert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="space-y-2">
        <Label htmlFor="token">Reset token</Label>
        <Input
          id="token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
          minLength={20}
          placeholder="Paste the token from your email or forgot-password page"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
      <Button type="submit" disabled={pending} className="h-10 w-full">
        {pending ? 'Updating…' : 'Update password'}
      </Button>
      <p className="text-sm text-muted-foreground">
        <Link
          href="/forgot-password"
          className={cn(buttonVariants({ variant: 'link' }), 'h-auto p-0')}
        >
          Request a new token
        </Link>
      </p>
    </form>
  );
}
