'use client';

import { useState } from 'react';
import { AuthFooterLink, AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { ErrorNotice } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post('/auth/forgot-password', { email }, { auth: false });
      setSent(true);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Password help"
      title="Reset your password."
      description="Tell us the email on your account and we will send a reset link."
      footer={
        <AuthFooterLink
          href="/login"
          label="Remembered it?"
          cta="Back to sign in"
        />
      }
    >
      {sent ? (
        <div className="rounded-card bg-support-soft px-5 py-4">
          <p className="font-semibold">Check your email.</p>
          <p className="mt-2 text-sm text-muted">
            If an account exists for {email}, a reset link is on its way. Then
            continue on the{' '}
            <a href="/reset-password" className="link-underline">
              reset page
            </a>
            .
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          {error ? <ErrorNotice message={error} /> : null}

          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </Field>

          <Button type="submit" size="lg" fullWidth disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
