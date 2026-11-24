'use client';

import { HandleSSOCallback } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { navigateTo } from '@/lib/auth/clerk-flow';
import { safeRedirectPath } from '@/lib/utils/url';

function Callback() {
  const router = useRouter();
  const next = safeRedirectPath(useSearchParams().get('next'), '/dashboard');

  return (
    <HandleSSOCallback
      navigateToApp={navigateTo(router, next)}
      navigateToSignIn={() => router.push('/login')}
      navigateToSignUp={() => router.push('/register')}
    />
  );
}

export default function SsoCallbackPage() {
  return (
    <Suspense fallback={null}>
      <Callback />
    </Suspense>
  );
}
