'use client';

import { SignIn } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { AuthFooterLink, AuthLayout } from '@/components/features/auth/auth-layout';
import { safeRedirectPath } from '@/lib/utils/url';

function LoginForm() {
  const searchParams = useSearchParams();
  const clerkRedirect = searchParams.get('redirect_url');
  const redirectTo = safeRedirectPath(
    searchParams.get('next') ??
      (clerkRedirect?.startsWith(window.location.origin)
        ? clerkRedirect.slice(window.location.origin.length)
        : null),
    '/dashboard',
  );

  return (
    <SignIn
      routing="hash"
      signUpUrl="/register"
      forceRedirectUrl={redirectTo}
    />
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
