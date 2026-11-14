import { ArrowUpRight, ChevronRight, MapPin, Mouse, Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/features/home/reveal';
import { CountUp } from '@/components/features/home/count-up';
import { ExpandingCards } from '@/components/features/home/expanding-cards';
import { ScrollScale } from '@/components/features/home/scroll-scale';
import { SpotlightCarousel } from '@/components/features/home/spotlight-carousel';
import { AutoRefresh } from '@/components/layout/auto-refresh';
import { columns } from '@/components/layout/site-footer';
import {
  authImage,
  featuredWork,
  heroImage,
  isOptimizableImage,
  spotlightImage,
} from '@/lib/utils/images';
import { fetchPublic } from '@/lib/api/server-api';
import type { DesignerSummary, Paginated } from '@/lib/types';

const rooms = ['Living Room', 'Bedroom', 'Kitchen', 'Dining Room', 'Home Office'];

const stats = [
  { value: 'Free', unit: 'to post', label: 'Posting a brief costs nothing' },
  { value: '3', unit: 'Steps', label: 'From brief to handover' },
  { value: '100%', unit: 'Reviewed', label: 'Designers verified by an admin' },
  { value: '1', unit: 'Workspace', label: 'Messages, files and payments' },
];

const highlights = [
  { title: 'Verified designers', body: 'Credentials checked before the badge appears.' },
  { title: 'Milestone payments', body: 'Pay for each stage after you approve it.' },
  { title: 'Side-by-side proposals', body: 'Compare scope, timeline and cost at a glance.' },
  { title: 'One workspace', body: 'Messages, files and approvals kept together.' },
];

const steps = [
  {
    title: 'Write your brief',
    body: 'Describe the space, the budget and the feeling you are after. Add a moodboard if you already have one.',
    image: authImage,
  },
  {
    title: 'Compare proposals',
    body: 'Verified designers respond with scope, timeline and cost. Read them side by side before you commit.',
    image: featuredWork[1].src,
  },
  {
    title: 'Work in one place',
    body: 'Track stages, approve deliverables and keep every message and file together.',
    image: spotlightImage,
  },
  {
    title: 'Pay per milestone',
    body: 'Posting a brief is free. You pay per milestone, after you approve each stage.',
    image: featuredWork[2].src,
  },
  {
    title: 'Verified designers',
    body: 'Every designer submits proof of qualification and past work for review before the verified badge appears.',
    image: featuredWork[3].src,
  },
];

const promotions = [
  {
    label: 'New',
    title: 'Compare proposals side by side',
    body: "See every designer's fees, timeline and stages in one view before you accept.",
    href: '/briefs/new',
    cta: 'Start a brief',
    image: featuredWork[0].src,
  },
  {
    label: 'Open projects',
    title: 'Post a project, let designers come to you',
    body: 'Describe the space and budget once. Designers reply with proposals you can compare.',
    href: '/requests/new',
    cta: 'Post a project',
    image: authImage,
  },
  {
    label: 'For designers',
    title: 'Find your next project',
    body: 'Browse open projects from clients and send a proposal with your scope and fees.',
    href: '/open-projects',
    cta: 'See open projects',
    image: spotlightImage,
  },
];

const heading = 'font-medium leading-[1.05] tracking-[-0.03em]';
const sectionTitle = `${heading} text-[clamp(2rem,4vw,3.25rem)]`;
const muted = 'text-muted';

export default async function HomePage() {
  const designers = await fetchPublic<Paginated<DesignerSummary>>(
    '/designers?verifiedOnly=true&pageSize=3',
  );
  const avatars = (designers?.items ?? []).filter((d) => d.avatarUrl);

  return (
    <div className="bg-canvas text-ink">
      <AutoRefresh />

      <section aria-labelledby="home-hero-title" className="shell sticky top-0 pb-16 pt-24 md:pt-28">
        <ScrollScale mode="exit" from={1} to={0.9} className="origin-top">
        <div className="relative isolate flex min-h-[600px] overflow-hidden rounded-2xl md:min-h-[calc(100vh-8rem)]">
          <Image
            src={heroImage}
            alt="A bright living room with arched windows, layered seating and warm natural textures"
            fill
            priority
            sizes="100vw"
            className="-z-10 object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
          <Reveal className="mt-auto max-w-2xl px-6 pb-10 text-white sm:px-10 sm:pb-14 lg:px-14">
            <h1 id="home-hero-title" className={`${heading} text-[clamp(2.5rem,6vw,5rem)]`}>
              Designing Spaces That Feel Like You
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">
              Discover rooms you love, find a verified interior designer, and
              bring it all together in one place.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <ArrowButton href="/explore" tone="light">
                Explore Spaces
              </ArrowButton>
              <Link
                href="/explore?tab=designers"
                className="text-sm font-medium underline decoration-white/50 underline-offset-[6px] hover:decoration-white"
              >
                Find a Designer
              </Link>
            </div>
          </Reveal>
          <Mouse aria-hidden className="absolute bottom-10 right-10 hidden h-6 w-6 text-white/80 sm:block" />
        </div>
        </ScrollScale>
      </section>

      <div className="relative z-10 rounded-t-[2rem] bg-canvas pt-16 shadow-[0_-24px_48px_-24px_rgba(0,0,0,0.35)] md:pt-24">
      <section aria-labelledby="about-title" className="shell pb-16 md:pb-24">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.4fr_0.9fr]">
          <Reveal>
            <p className="text-sm font-medium uppercase tracking-[0.08em]">About Inside</p>
            <div className="relative mt-8 hidden aspect-[4/5] w-full max-w-[260px] overflow-hidden rounded-2xl lg:block">
              <Image src={featuredWork[3].src} alt="" fill sizes="260px" className="object-cover" />
            </div>
          </Reveal>
          <Reveal delay={60}>
            <h2 id="about-title" className={sectionTitle}>
              Timeless Interiors
              <br />
              Elevated Living
            </h2>
            <p className={`mt-6 max-w-sm text-sm leading-relaxed ${muted}`}>
              Inside connects homeowners with verified interior designers.
              Every project is briefed, compared and approved stage by stage,
              ensuring comfort, elegance and a seamless journey from concept to
              completion.
            </p>
            <div className="mt-8">
              <ArrowButton href="/how-it-works" tone="dark">
                More About Us
              </ArrowButton>
            </div>
            <ul className="mt-12 grid max-w-md gap-x-8 gap-y-6 border-t border-ink/10 pt-8 sm:grid-cols-2">
              {highlights.map((item) => (
                <li key={item.title}>
                  <p className="font-medium tracking-[-0.01em]">{item.title}</p>
                  <p className={`mt-1 text-xs leading-relaxed ${muted}`}>{item.body}</p>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120} className="lg:pt-14">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
              <Image
                src={spotlightImage}
                alt="A designer reviewing material samples"
                fill
                sizes="(min-width: 1024px) 25vw, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>

        <dl className="mt-16 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 80}>
              <div className="h-full rounded-2xl bg-sand p-5 sm:p-6">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="flex items-baseline gap-2">
                  <span className="text-[clamp(2.25rem,4vw,3.25rem)] font-medium leading-none tracking-[-0.03em]">
                    <CountUp value={stat.value} />
                  </span>
                  <span className={`text-xs ${muted}`}>{stat.unit}</span>
                </dd>
                <p aria-hidden className="mt-6 border-t border-ink/10 pt-4 text-sm">
                  {stat.label}
                </p>
              </div>
            </Reveal>
          ))}
        </dl>
      </section>

      <section aria-labelledby="steps-title" className="shell pb-16 md:pb-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal className="flex flex-col">
            <h2 id="steps-title" className={sectionTitle}>
              Brief, Design &amp;
              <br />
              Elevate with Inside
            </h2>
            <ul className="mt-12 space-y-3 lg:mt-20">
              {rooms.map((room) => (
                <li key={room}>
                  <Link
                    href={`/explore?roomType=${encodeURIComponent(room)}`}
                    className="text-base text-ink/40 transition-all duration-300 hover:text-2xl hover:font-medium hover:tracking-[-0.02em] hover:text-ink focus-visible:text-2xl focus-visible:text-ink"
                  >
                    {room}
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120} className="divide-y divide-ink/10">
            {steps.map((step, index) => (
              <details key={step.title} className="group py-5 first:pt-0">
                <summary className="flex cursor-pointer list-none items-baseline gap-3">
                  <span className={`text-xs ${muted}`}>{String(index + 1).padStart(2, '0')}</span>
                  <span className="text-xl font-medium tracking-[-0.02em]">{step.title}</span>
                  <Plus
                    aria-hidden
                    className={`ml-auto h-4 w-4 shrink-0 self-center ${muted} transition-transform duration-300 group-open:rotate-45`}
                  />
                </summary>
                <div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-2xl">
                  <Image
                    src={step.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <p className={`mt-4 max-w-lg text-xs leading-relaxed ${muted}`}>{step.body}</p>
              </details>
            ))}
          </Reveal>
        </div>
      </section>

      <section aria-label="Featured projects" className="shell pb-16 md:pb-24">
        <ScrollScale mode="enter" from={0.8} to={1}>
          <SpotlightCarousel
            slides={featuredWork}
            hotspot={{ title: 'Verified designers', src: spotlightImage, href: '/explore?tab=designers' }}
          />
        </ScrollScale>
      </section>

      <section aria-labelledby="work-title" className="shell pb-16 md:pb-24">
        <Reveal className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.08em]">Selected Work</p>
            <h2 id="work-title" className={`${sectionTitle} mt-6 max-w-2xl`}>
              Discover Newly Curated Rooms for Modern Living
            </h2>
          </div>
          <div className="max-w-sm lg:justify-self-end">
            <p className={`text-sm leading-relaxed ${muted}`}>
              Browse finished spaces from Inside designers, from warm minimal
              lofts to coastal townhouses, and save the ones you love.
            </p>
            <div className="mt-6">
              <ArrowButton href="/explore" tone="dark" small>
                View All Work
              </ArrowButton>
            </div>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-x-8 gap-y-12 md:grid-cols-12">
          {featuredWork.map((work, index) => (
            <Reveal
              key={work.id}
              delay={(index % 2) * 120}
              className={`min-w-0 ${index === 0 || index === 3 ? 'md:col-span-7' : 'md:col-span-5'} ${
                index % 2 === 1 ? 'md:mt-16' : ''
              }`}
            >
              <Link href="/explore" className="group block">
                <div className="relative aspect-[3/2] overflow-hidden rounded-2xl">
                  <Image
                    src={work.src}
                    alt={work.title}
                    fill
                    sizes="(min-width: 768px) 45vw, 100vw"
                    className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04]"
                  />
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-4">
                  <h3 className="text-lg font-medium tracking-[-0.02em]">{work.title}</h3>
                  <p className="whitespace-nowrap text-sm">{work.style}</p>
                </div>
                <p className={`mt-1 flex items-center gap-1 text-xs ${muted}`}>
                  <MapPin aria-hidden className="h-3 w-3" /> Illustrative project
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section aria-labelledby="promo-title" className="shell pb-16 md:pb-24">
        <Reveal className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <h2 id="promo-title" className={`${sectionTitle} max-w-xl`}>
            Interior spaces crafted with elegance, precision, and refined aesthetics
          </h2>
          <div className="max-w-xs lg:justify-self-end">
            <p className={`text-sm leading-relaxed ${muted}`}>
              Thoughtfully planned projects that blend comfort and function,
              managed in one place from brief to handover.
            </p>
            <div className="mt-5">
              <ArrowButton href="/how-it-works" tone="dark" small>
                How It Works
              </ArrowButton>
            </div>
          </div>
        </Reveal>

        <Reveal className="mt-10">
          <ExpandingCards cards={promotions} />
        </Reveal>
      </section>

      <footer className="bg-brand-deep text-canvas">
        <div className="shell pt-14 md:pt-20">
          <Reveal className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <h2 className={`${heading} text-[clamp(1.75rem,3.5vw,2.75rem)]`}>
              <span className="block md:pl-16">Discover Timeless Interiors</span>
              Crafted for Modern Living
            </h2>
            <div>
              {avatars.length > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {avatars.map((designer) => (
                      <span
                        key={designer.id}
                        className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-brand-deep"
                      >
                        <Image
                          src={designer.avatarUrl as string}
                          alt={designer.name}
                          fill
                          sizes="32px"
                          unoptimized={!isOptimizableImage(designer.avatarUrl as string)}
                          className="object-cover"
                        />
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-canvas/70">Verified designers on Inside</p>
                </div>
              ) : null}
              <div className="mt-4">
                <ArrowButton href="/briefs/new" tone="light" small>
                  Start Your Brief
                </ArrowButton>
              </div>
            </div>
          </Reveal>

          <nav
            aria-label="Footer"
            className="mt-12 grid gap-10 border-t border-canvas/10 pt-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]"
          >
            <ul className="divide-y divide-canvas/10 border-b border-canvas/10 lg:mr-16">
              {columns[0].links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center justify-between py-3 text-sm transition-colors hover:text-white"
                  >
                    {link.label}
                    <ArrowUpRight aria-hidden className="h-4 w-4" />
                  </Link>
                </li>
              ))}
            </ul>
            {columns.slice(1).map((column) => (
              <div key={column.heading} className="lg:border-l lg:border-canvas/10 lg:pl-6">
                <h3 className="text-sm font-medium">{column.heading}</h3>
                <ul className="mt-3 space-y-2">
                  {column.links.map((link) => (
                    <li key={`${column.heading}-${link.label}`}>
                      <Link href={link.href} className="text-sm text-canvas/70 hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="lg:border-l lg:border-canvas/10 lg:pl-6">
              <h3 className="text-sm font-medium">Trust</h3>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/safety" className="text-sm text-canvas/70 hover:text-white">Trust &amp; safety</Link>
                </li>
                <li>
                  <Link href="/verification" className="text-sm text-canvas/70 hover:text-white">Verification</Link>
                </li>
              </ul>
            </div>
          </nav>

          <div className="mt-12 flex flex-col gap-2 text-xs text-canvas/60 sm:flex-row sm:justify-between">
            <p>&copy; {new Date().getFullYear()} Inside. All rights reserved.</p>
            <Link href="/how-it-works" className="hover:text-white">How Inside works</Link>
          </div>

          <Reveal>
            <p
              aria-hidden
              className="flex select-none items-end justify-center gap-[1.5vw] pt-10 text-[clamp(5rem,21vw,19rem)] font-medium uppercase leading-[0.78] tracking-[-0.04em]"
            >
              <span>Ins</span>
              <span className="relative mb-[0.02em] h-[0.74em] w-[0.36em] shrink-0 overflow-hidden rounded-full">
                <Image src={heroImage} alt="" fill sizes="20vw" className="object-cover" />
              </span>
              <span>de</span>
            </p>
          </Reveal>
        </div>
      </footer>
      </div>
    </div>
  );
}

function ArrowButton({
  href,
  tone,
  small = false,
  children,
}: {
  href: string;
  tone: 'light' | 'dark';
  small?: boolean;
  children: React.ReactNode;
}) {
  const colors =
    tone === 'light'
      ? 'bg-canvas text-ink group-hover:bg-white'
      : 'bg-brand text-canvas group-hover:bg-brand-deep';
  return (
    <Link href={href} className={`group inline-flex items-stretch gap-1 font-medium ${small ? 'text-xs' : 'text-sm'}`}>
      <span className={`rounded-md transition-colors ${small ? 'px-3 py-2' : 'px-5 py-3'} ${colors}`}>
        {children}
      </span>
      <span className={`grid place-items-center rounded-md transition-colors ${small ? 'w-8' : 'w-11'} ${colors}`}>
        <ChevronRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
