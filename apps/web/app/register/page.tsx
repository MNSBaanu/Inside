'use client';

import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthFooterLink, AuthLayout } from '@/components/features/auth/auth-layout';
import { GoogleSignInButton } from '@/components/features/auth/google-sign-in-button';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';
import { ErrorNotice } from '@/components/ui/feedback';
import { clerkErrorMessage } from '@/lib/auth/clerk-error';
import { cn } from '@/lib/utils/cn';

const roles = [
  {
    value: 'CLIENT' as const,
    title: 'I have a space',
    body: 'Brief a project and hire a designer.',
  },
  {
    value: 'DESIGNER' as const,
    title: 'I am a designer',
    body: 'Show your work and win projects.',
  },
];

export default function RegisterPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [role, setRole] = useState<'CLIENT' | 'DESIGNER'>('CLIENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function finish(sessionId: string | null) {
    await setActive?.({ session: sessionId });
    router.push('/dashboard');
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isLoaded) return;
    setError(null);
    setSubmitting(true);
    try {
      if (verifying) {
        const result = await signUp.attemptEmailAddressVerification({ code });
        if (result.status === 'complete') return await finish(result.createdSessionId);
        throw new Error('That code did not work. Try again.');
      }

      const [firstName, ...rest] = name.trim().split(/\s+/);
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName: rest.join(' ') || undefined,
        unsafeMetadata: { role },
      });
      if (result.status === 'complete') return await finish(result.createdSessionId);
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setVerifying(true);
      setSubmitting(false);
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
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
        unsafeMetadata: { role },
      });
    } catch (cause) {
      setError(clerkErrorMessage(cause));
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Create account"
      title="Start your first project."
      description="One account covers briefing, proposals, milestones and messaging."
      footer={
        <AuthFooterLink
          href="/login"
          label="Already have an account?"
          cta="Sign in"
        />
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        {error ? <ErrorNotice message={error} /> : null}

        {verifying ? (
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
            <fieldset className="flex flex-col gap-3">
              <legend className="label mb-3 text-ink/70">I am joining as</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {roles.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRole(option.value)}
                    aria-pressed={role === option.value}
                    className={cn(
                      'rounded-card border p-5 text-left transition-colors duration-300',
                      role === option.value
                        ? 'border-brand bg-brand-soft'
                        : 'border-hairline bg-surface hover:border-ink/30',
                    )}
                  >
                    <span className="block font-display text-lg font-semibold">
                      {option.title}
                    </span>
                    <span
                      className={cn(
                        'mt-1 block text-sm',
                        role === option.value ? 'text-ink' : 'text-muted',
                      )}
                    >
                      {option.body}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            <Field label="Full name" htmlFor="name">
              <Input
                id="name"
                autoComplete="name"
                required
                minLength={2}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Amara Weerasinghe"
              />
            </Field>

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

            <Field
              label="Password"
              htmlFor="password"
              hint="At least 8 characters."
            >
              <PasswordInput
                id="password"
                name="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </Field>

            <div id="clerk-captcha" />
          </>
        )}

        <Button type="submit" size="lg" fullWidth disabled={submitting || !isLoaded}>
          {submitting
            ? verifying
              ? 'Verifying…'
              : 'Creating account…'
            : verifying
              ? 'Verify email'
              : 'Create account'}
        </Button>

        {verifying ? null : (
          <GoogleSignInButton
            label="Sign up with Google"
            disabled={submitting || !isLoaded}
            onClick={onGoogle}
          />
        )}
      </form>
    </AuthLayout>
  );
}
