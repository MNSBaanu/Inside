'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InlineAlert } from '@/components/layout/inline-alert';
import { forgotPasswordRequest, formatApiError } from '@/lib/api/auth';
import { cn } from '@/lib/utils';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    setResetToken(null);
    try {
      const data = await forgotPasswordRequest(email.trim());
      setMessage(data.message);
      if (data.resetToken) setResetToken(data.resetToken);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
      {message ? <InlineAlert tone="success">{message}</InlineAlert> : null}
      {resetToken ? (
        <div className="surface-panel space-y-2 p-4 text-sm">
          <p className="font-medium">Dev reset link</p>
          <p className="text-muted-foreground">
            Email is not sent in local/dev — use this token once:
          </p>
          <Link
            href={`/reset-password?token=${encodeURIComponent(resetToken)}`}
            className={cn(buttonVariants({ size: 'sm' }))}
          >
            Continue to reset password
          </Link>
        </div>
      ) : null}
      <Button type="submit" disabled={pending} className="h-10 w-full">
        {pending ? 'Sending…' : 'Send reset link'}
      </Button>
      <p className="text-sm text-muted-foreground">
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: 'link' }), 'h-auto p-0')}
        >
          Back to log in
        </Link>
      </p>
    </form>
  );
}
