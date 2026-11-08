'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { AuthFooterLink, AuthLayout } from '@/components/features/auth/auth-layout';
import { Button, ButtonLink } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { ErrorNotice, Skeleton, SuccessNotice } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api/client';

function VerifyForm() {
  const searchParams = useSearchParams();
  const linkToken = searchParams.get('token');

  const [token, setToken] = useState(linkToken ?? '');
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(Boolean(linkToken));
  const autoRan = useRef(false);

  const verify = useCallback(async (value: string) => {
    setError(null);
    setBusy(true);
    try {
      await api.post('/auth/verify-email', { token: value }, { auth: false });
      setVerified(true);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!linkToken || autoRan.current) return;
    autoRan.current = true;
    void verify(linkToken);
  }, [linkToken, verify]);

  if (verified) {
    return (
      <div className="flex flex-col gap-6">
        <SuccessNotice message="Your email is verified." />
        <ButtonLink href="/login" size="lg" fullWidth>
          Continue to sign in
        </ButtonLink>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    await verify(token);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {error ? <ErrorNotice message={error} /> : null}

      <Field
        label="Verification code"
        htmlFor="token"
        hint="From the verification link in your email."
      >
        <Input
          id="token"
          required
          minLength={20}
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />
      </Field>

      <Button type="submit" size="lg" fullWidth disabled={busy}>
        {busy ? 'Verifying…' : 'Verify email'}
      </Button>
    </form>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthLayout
      eyebrow="Account"
      title="Verify your email."
      description="Confirming your address unlocks requests, proposals and messaging."
      footer={
        <AuthFooterLink href="/login" label="Already verified?" cta="Sign in" />
      }
    >
      <Suspense fallback={<Skeleton className="h-64" />}>
        <VerifyForm />
      </Suspense>
    </AuthLayout>
  );
}
