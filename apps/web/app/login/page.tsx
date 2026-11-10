'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AuthFooterLink, AuthLayout } from '@/components/features/auth/auth-layout';
import { useSession } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';
import { ErrorNotice } from '@/components/ui/feedback';
import { errorMessage } from '@/lib/api/client';
import { safeRedirectPath } from '@/lib/utils/url';

function LoginForm() {
  const { login } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get('next'), '/dashboard');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push(redirectTo);
    } catch (cause) {
      setError(errorMessage(cause));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {error ? <ErrorNotice message={error} /> : null}

      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </Field>

      <Field label="Password" htmlFor="password">
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
        />
      </Field>

      <Button type="submit" size="lg" fullWidth disabled={submitting}>
        {submitting ? 'Signing in…' : 'Sign in'}
      </Button>

      <Link
        href="/forgot-password"
        className="link-underline self-start text-sm text-muted"
      >
        Forgot your password?
      </Link>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in to Inside."
      description="Pick up where you left off - your briefs, proposals and projects are waiting."
      footer={
        <AuthFooterLink
          href="/register"
          label="New here?"
          cta="Create an account"
        />
      }
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
