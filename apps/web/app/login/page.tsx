'use client';

import { SignIn } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { AuthFooterLink, AuthLayout } from '@/components/features/auth/auth-layout';
import { ErrorNotice } from '@/components/ui/feedback';
import { safeRedirectPath } from '@/lib/utils/url';

function LoginForm() {
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

  return (
    <div className="flex flex-col gap-6">
      {searchParams.get('suspended') ? (
        <ErrorNotice message="Account suspended" />
      ) : null}
      <SignIn
        routing="hash"
        signUpUrl="/register"
        forceRedirectUrl={redirectTo}
      />
    </div>
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
