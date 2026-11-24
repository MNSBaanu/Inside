'use client';

import { useAuth, useSignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { AuthFooterLink, AuthLayout } from '@/components/features/auth/auth-layout';
import { GoogleSignInButton } from '@/components/features/auth/google-sign-in-button';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';
import { ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { clerkErrorMessage, navigateTo } from '@/lib/auth/clerk-flow';
import { safeRedirectPath } from '@/lib/utils/url';

function LoginForm() {
  const { signIn, fetchStatus } = useSignIn();
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
  const busy = submitting || fetchStatus === 'fetching';
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) router.replace(redirectTo);
  }, [isSignedIn, redirectTo, router]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { error } = needsCode
        ? await signIn.mfa.verifyEmailCode({ code })
        : await signIn.password({ emailAddress: email, password });
      if (error) throw error;

      if (signIn.status === 'complete') {
        await signIn.finalize({ navigate: navigateTo(router, redirectTo) });
        return;
      }
      if (needsCode) throw new Error('That code did not work. Try again.');
      if (
        (signIn.status === 'needs_client_trust' ||
          signIn.status === 'needs_second_factor') &&
        signIn.supportedSecondFactors.some((f) => f.strategy === 'email_code')
      ) {
        const sent = await signIn.mfa.sendEmailCode();
        if (sent.error) throw sent.error;
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
    setError(null);
    setSubmitting(true);
    const { error } = await signIn.sso({
      strategy: 'oauth_google',
      redirectCallbackUrl: `/sso-callback?next=${encodeURIComponent(redirectTo)}`,
      redirectUrl: redirectTo,
    });
    if (error) {
      setError(clerkErrorMessage(error));
      setSubmitting(false);
    }
  }

  if (isSignedIn) return <Skeleton className="h-72" />;

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

      <Button type="submit" size="lg" fullWidth disabled={busy}>
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
            disabled={busy}
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
