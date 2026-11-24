'use client';

import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthFooterLink, AuthLayout } from '@/components/features/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';
import { ErrorNotice } from '@/components/ui/feedback';
import { clerkErrorMessage, navigateTo } from '@/lib/auth/clerk-flow';

export default function ForgotPasswordPage() {
  const { signIn, fetchStatus } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const busy = submitting || fetchStatus === 'fetching';

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (!sent) {
        const created = await signIn.create({ identifier: email });
        if (created.error) throw created.error;
        const sentCode = await signIn.resetPasswordEmailCode.sendCode();
        if (sentCode.error) throw sentCode.error;
        setSent(true);
        setSubmitting(false);
        return;
      }

      if (signIn.status !== 'needs_new_password') {
        const verified = await signIn.resetPasswordEmailCode.verifyCode({ code });
        if (verified.error) throw verified.error;
      }
      const saved = await signIn.resetPasswordEmailCode.submitPassword({
        password,
        signOutOfOtherSessions: true,
      });
      if (saved.error) throw saved.error;
      if (signIn.status !== 'complete') {
        throw new Error('That code did not work. Try again.');
      }
      await signIn.finalize({ navigate: navigateTo(router, '/dashboard') });
    } catch (cause) {
      setError(clerkErrorMessage(cause));
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Password help"
      title="Reset your password."
      description="Tell us the email on your account and we will send a reset code."
      footer={
        <AuthFooterLink
          href="/login"
          label="Remembered it?"
          cta="Back to sign in"
        />
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        {error ? <ErrorNotice message={error} /> : null}

        {sent ? (
          <>
            <Field
              label="Reset code"
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

            <Field
              label="New password"
              htmlFor="password"
              hint="At least 8 characters."
            >
              <PasswordInput
                id="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </Field>
          </>
        ) : (
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
        )}

        <Button type="submit" size="lg" fullWidth disabled={busy}>
          {busy
            ? sent
              ? 'Saving…'
              : 'Sending…'
            : sent
              ? 'Set new password'
              : 'Send reset code'}
        </Button>
      </form>
    </AuthLayout>
  );
}
