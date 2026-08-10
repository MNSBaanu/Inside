import Link from 'next/link';
import { SiteHeader } from '@/components/layout/site-header';
import { RegisterForm } from '@/components/auth/register-form';
import { HERO_IMAGE } from '@/lib/media';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden overflow-hidden lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_IMAGE}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,oklch(0.18_0.03_155_/_0.35),oklch(0.18_0.03_155_/_0.7))]" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white">
            <p className="font-heading text-4xl tracking-tight">Inside</p>
            <p className="mt-2 max-w-sm text-sm text-white/75">
              Join as a client seeking talent, or a designer ready to publish work.
            </p>
          </div>
        </div>
        <div className="flex flex-col">
          <SiteHeader />
          <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-12">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Get started
              </p>
              <h1 className="font-heading text-4xl tracking-tight">Register</h1>
              <p className="text-sm text-muted-foreground">
                Create a client or designer account in under a minute.
              </p>
            </div>
            <RegisterForm />
            <p className="text-sm text-muted-foreground lg:hidden">
              Already registered?{' '}
              <Link href="/login" className="underline underline-offset-4">
                Log in
              </Link>
            </p>
          </main>
        </div>
      </div>
    </div>
  );
}
