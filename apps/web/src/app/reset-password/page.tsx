import { Suspense } from 'react';
import { SiteHeader } from '@/components/layout/site-header';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { AUTH_IMAGE } from '@/lib/media';

export default function ResetPasswordPage() {
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
        </div>
        <div className="flex flex-col">
          <SiteHeader />
          <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
            <div className="glass flex flex-col gap-8 rounded-3xl p-7 md:p-8">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Account recovery
                </p>
                <h1 className="font-heading text-4xl tracking-tight">
                  Reset password
                </h1>
                <p className="text-sm text-muted-foreground">
                  Choose a new password for your Inside account.
                </p>
              </div>
              <Suspense
                fallback={
                  <p className="text-sm text-muted-foreground">Loading…</p>
                }
              >
                <ResetPasswordForm />
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
