import { Suspense } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/layout/site-header';
import { LoginForm } from '@/components/auth/login-form';
import { AUTH_IMAGE } from '@/lib/media';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden overflow-hidden lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={AUTH_IMAGE}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,oklch(0.18_0.03_155_/_0.35),oklch(0.18_0.03_155_/_0.7))]" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white">
            <p className="font-heading text-4xl tracking-tight">Inside</p>
            <p className="mt-2 max-w-sm text-sm text-white/75">
              Sign in to discover designers, build briefs, and manage projects.
            </p>
          </div>
        </div>
        <div className="flex flex-col">
          <SiteHeader />
          <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-12">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Welcome back
              </p>
              <h1 className="font-heading text-4xl tracking-tight">Log in</h1>
              <p className="text-sm text-muted-foreground">
                Use a demo account for viva walkthroughs, or your own credentials.
              </p>
            </div>
            <Suspense
              fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
            >
              <LoginForm />
            </Suspense>
            <p className="text-sm text-muted-foreground lg:hidden">
              New here?{' '}
              <Link href="/register" className="underline underline-offset-4">
                Create an account
              </Link>
            </p>
          </main>
        </div>
      </div>
    </div>
  );
}
