import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { SiteHeader } from '@/components/layout/site-header';
import { AUTH_IMAGE, HERO_IMAGE, HOW_IMAGES } from '@/lib/media';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    title: 'Discover',
    copy: 'Browse published portfolios by style, room, and budget.',
    image: HOW_IMAGES[0],
  },
  {
    title: 'Brief',
    copy: 'Shape a moodboard and brief that designers can actually match.',
    image: HOW_IMAGES[1],
  },
  {
    title: 'Collaborate',
    copy: 'Work in stages, approve deliverables, and release milestones.',
    image: HOW_IMAGES[2],
  },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader variant="public" overlay />

      <section className="relative min-h-[100svh] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_IMAGE}
          alt=""
          className="animate-ken absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,oklch(0.18_0.03_155_/_0.78)_0%,oklch(0.18_0.03_155_/_0.45)_45%,oklch(0.18_0.03_155_/_0.2)_100%)]" />
        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 md:pb-24">
          <div className="glass-dark animate-rise max-w-2xl rounded-3xl p-7 md:p-10">
          <p className="font-heading text-6xl tracking-tight text-white md:text-8xl">
            Inside
          </p>
          <h1 className="animate-rise-delay mt-4 max-w-xl text-xl font-medium leading-snug text-white/95 md:text-2xl">
            Hire interior designers through briefs, stages, and milestone trust.
          </h1>
          <p className="animate-rise-delay-2 mt-3 max-w-lg text-sm leading-relaxed text-white/75 md:text-base">
            Discover portfolios, shape a visual brief, collaborate stage by
            stage, and release payment only when you approve the work.
          </p>
          <div className="animate-rise-delay-2 mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'bg-white text-[oklch(0.24_0.03_155)] hover:bg-white/90',
              )}
            >
              Create account
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white',
              )}
            >
              Sign in
            </Link>
          </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <div className="mb-10 max-w-xl space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            How it works
          </p>
          <h2 className="font-heading text-3xl tracking-tight md:text-4xl">
            From inspiration to approved rooms
          </h2>
          <p className="text-muted-foreground">
            A clear path for clients and designers — without the chaos of
            unstructured hiring.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <article
              key={step.title}
              className="glass space-y-4 rounded-3xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_64px_-34px_oklch(0.22_0.02_145_/_0.55)]"
            >
              <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={step.image}
                  alt=""
                  className="h-full w-full object-cover transition duration-700 hover:scale-[1.03]"
                />
              </div>
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-8 shrink-0 place-items-center rounded-full border border-primary/15 bg-primary/[0.07] text-xs font-semibold text-primary"
                >
                  0{index + 1}
                </span>
                <h3 className="font-heading text-2xl tracking-tight">
                  {step.title}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.copy}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border/70">
        <div className="mx-auto grid max-w-6xl gap-0 md:grid-cols-2">
          <div className="flex flex-col justify-center gap-5 px-4 py-16 md:px-8 md:py-24">
            <p className="font-heading text-4xl tracking-tight md:text-5xl">
              Built for viva-ready demos
            </p>
            <p className="max-w-md text-muted-foreground">
              Seed accounts for client, designer, and admin — walk the full
              marketplace flow with confidence.
            </p>
            <div>
              <Link href="/login" className={cn(buttonVariants({ size: 'lg' }))}>
                Open demo login
              </Link>
            </div>
          </div>
          <div className="relative min-h-[280px] overflow-hidden md:min-h-[420px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={AUTH_IMAGE}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <footer className="border-t border-border/70 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="grid size-7 place-items-center rounded-full border border-primary/15 bg-primary/10 text-[13px] font-semibold text-primary"
            >
              In
            </span>
            <span className="font-heading text-base text-foreground">
              Inside
            </span>
          </span>
          <span>Interior marketplace · academic project</span>
        </div>
      </footer>
    </div>
  );
}
