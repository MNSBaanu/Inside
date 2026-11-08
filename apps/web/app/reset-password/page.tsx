'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AuthFooterLink, AuthLayout } from '@/components/features/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api/client';

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState(searchParams.get('token') ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post(
        '/auth/reset-password',
        { token, newPassword },
        { auth: false },
      );
      router.push('/login');
    } catch (cause) {
      setError(errorMessage(cause));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {error ? <ErrorNotice message={error} /> : null}

      <Field
        label="Reset code"
        htmlFor="token"
        hint="From the reset link in your email."
      >
        <Input
          id="token"
          required
          minLength={20}
          value={token}
          onChange={(event) => setToken(event.target.value)}
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
          placeholder="••••••••"
        />
      </Field>

      <Button type="submit" size="lg" fullWidth disabled={busy}>
        {busy ? 'Updating…' : 'Set new password'}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      eyebrow="Password help"
      title="Choose a new password."
      description="Paste the code from your reset email and pick something new."
      footer={
        <AuthFooterLink
          href="/forgot-password"
          label="No code?"
          cta="Request another"
        />
      }
    >
      <Suspense fallback={<Skeleton className="h-64" />}>
        <ResetForm />
      </Suspense>
    </AuthLayout>
  );
}
