import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { SiteHeader } from '@/components/layout/site-header';
import { cn } from '@/lib/utils';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--brand-wash),_transparent_50%),linear-gradient(180deg,_oklch(0.97_0.02_95),_var(--background)_45%)]">
      <SiteHeader />
      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-20 pt-16 md:pt-24">
        <p className="font-heading text-5xl leading-none tracking-tight text-foreground md:text-7xl">
          Inside
        </p>
        <div className="max-w-xl space-y-4">
          <h1 className="text-2xl font-medium tracking-tight text-foreground md:text-3xl">
            Hire designers through briefs, stages, and milestone trust.
          </h1>
          <p className="text-base text-muted-foreground md:text-lg">
            Discover portfolios, shape a visual brief, collaborate stage by
            stage, and release payment only when you approve the work.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/register" className={cn(buttonVariants({ size: 'lg' }))}>
            Create account
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
          >
            Sign in
          </Link>
        </div>
      </section>
    </div>
  );
}
