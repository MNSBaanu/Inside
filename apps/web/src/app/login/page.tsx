import { Suspense } from 'react';
import { SiteHeader } from '@/components/layout/site-header';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl tracking-tight">Log in</h1>
          <p className="text-sm text-muted-foreground">
            Seed demo: client@inside.test / Password123!
          </p>
        </div>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
