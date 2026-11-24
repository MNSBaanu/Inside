'use client';

import { useSignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AuthFooterLink, AuthLayout } from '@/components/features/auth/auth-layout';
import { GoogleSignInButton } from '@/components/features/auth/google-sign-in-button';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';
import { ErrorNotice } from '@/components/ui/feedback';
import { clerkErrorMessage } from '@/lib/auth/clerk-error';
import { safeRedirectPath } from '@/lib/utils/url';

function LoginForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clerkRedirect = searchParams.get('redirect_url');
  const origin = typeof window === 'undefined' ? null : window.location.origin;
  const redirectTo = safeRedirectPath(
    searchParams.get('next') ??
      (origin && clerkRedirect?.startsWith(origin)
        ? clerkRedirect.slice(origin.length)
        : null),
    '/dashboard',
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [needsCode, setNeedsCode] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get('suspended') ? 'Account suspended' : null,
  );
  const [submitting, setSubmitting] = useState(false);

  async function finish(sessionId: string | null) {
    await setActive?.({ session: sessionId });
    router.push(redirectTo);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isLoaded) return;
    setError(null);
    setSubmitting(true);
    try {
      if (needsCode) {
        const result = await signIn.attemptSecondFactor({
          strategy: 'email_code',
          code,
        });
        if (result.status === 'complete') return await finish(result.createdSessionId);
        throw new Error('That code did not work. Try again.');
      }

      const result = await signIn.create({ identifier: email, password });
      if (result.status === 'complete') return await finish(result.createdSessionId);
      if (result.supportedSecondFactors?.some((f) => f.strategy === 'email_code')) {
        await signIn.prepareSecondFactor({ strategy: 'email_code' });
        setNeedsCode(true);
        setSubmitting(false);
        return;
      }
      throw new Error('This account needs a sign-in step we do not support yet.');
    } catch (cause) {
      setError(clerkErrorMessage(cause));
      setSubmitting(false);
    }
  }

  async function onGoogle() {
    if (!isLoaded) return;
    setError(null);
    setSubmitting(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: redirectTo,
      });
    } catch (cause) {
      setError(clerkErrorMessage(cause));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error ? <ErrorNotice message={error} /> : null}

      {needsCode ? (
        <Field
          label="Verification code"
          htmlFor="code"
          hint={`We sent a code to ${email}.`}
        >
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="123456"
          />
        </Field>
      ) : (
        <>
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
        </>
      )}

      <Button type="submit" size="lg" fullWidth disabled={submitting || !isLoaded}>
        {submitting ? 'Signing in…' : needsCode ? 'Verify' : 'Sign in'}
      </Button>

      {needsCode ? null : (
        <>
          <Link
            href="/forgot-password"
            className="link-underline self-start text-sm text-muted"
          >
            Forgot your password?
          </Link>

          <GoogleSignInButton
            label="Continue with Google"
            disabled={submitting || !isLoaded}
            onClick={onGoogle}
          />
        </>
      )}
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout
      compact
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
