import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/reveal';
import { DesignerCard } from '@/components/designers/designer-card';
import { HeroSearch } from '@/components/hero-search';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { RoomHotspots } from '@/components/room-hotspots';
import {
  featuredWork,
  heroHotspots,
  heroImage,
  heroImageAspect,
  spotlightImage,
} from '@/lib/images';
import { fetchPublic } from '@/lib/server-api';
import type { DesignerSummary, Paginated } from '@/lib/types';

const styles = [
  'Minimalist',
  'Japandi',
  'Tropical Modern',
  'Scandinavian',
  'Bohemian',
  'Contemporary',
];

const rooms = [
  { name: 'Living Room', tone: 'bg-brand-soft' },
  { name: 'Bedroom', tone: 'bg-highlight-soft' },
  { name: 'Kitchen', tone: 'bg-support-soft' },
  { name: 'Dining Room', tone: 'bg-sand' },
  { name: 'Home Office', tone: 'bg-support-soft' },
  { name: 'Bathroom', tone: 'bg-sand' },
  { name: 'Kids Room', tone: 'bg-brand-soft' },
  { name: 'Balcony', tone: 'bg-highlight-soft' },
];

const testimonials = [
  {
    quote:
      'Three proposals arrived within a week, and seeing them side by side made the choice obvious.',
    name: 'Nadeesha P.',
    detail: 'Living room, Colombo',
  },
  {
    quote:
      'Paying per stage meant I never worried about money going out before the work was done.',
    name: 'Ruwan S.',
    detail: 'Kitchen, Kandy',
  },
  {
    quote:
      'Every drawing, message and approval was in one place instead of scattered across chats.',
    name: 'Amaya F.',
    detail: 'Bedroom, Galle',
  },
];

const faqs = [
  {
    question: 'How much does it cost to post a brief?',
    answer:
      'Posting a brief is free. You only pay once you accept a proposal, and payments are split across the agreed stages.',
  },
  {
    question: 'How are designers verified?',
    answer:
      'Designers submit proof of qualification and past work. An admin reviews it before the verified badge appears on their profile.',
  },
  {
    question: 'When is my payment released?',
    answer:
      'Each milestone payment is released only after you approve the deliverables for that stage.',
  },
  {
    question: 'Can I talk to a designer before accepting a proposal?',
    answer:
      'Yes. You can message designers from their profile or proposal to clarify scope, timeline and cost first.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Write your brief',
    body: 'Describe the space, the budget and the feeling you are after. Add a moodboard if you already have one.',
    tone: 'bg-highlight-soft',
  },
  {
    number: '02',
    title: 'Compare proposals',
    body: 'Verified designers respond with scope, timeline and cost. Read them side by side before you commit.',
    tone: 'bg-support-soft',
  },
  {
    number: '03',
    title: 'Work in one place',
    body: 'Track stages, approve deliverables and release milestone payments as the work actually completes.',
    tone: 'bg-brand-soft',
  },
];

const stats = [
  { value: '240+', caption: 'Verified designers' },
  { value: '1,800', caption: 'Rooms completed' },
  { value: '4.8', caption: 'Average rating' },
];

const promotions = [
  {
    label: 'New',
    title: 'Compare proposals side by side',
    body:
      "See every designer's fees, timeline and stages in one view before you accept.",
    href: '/briefs/new',
    cta: 'Start a brief',
  },
  {
    label: 'Open projects',
    title: 'Post a project, let designers come to you',
    body: 'Describe the space and budget once. Designers reply with proposals you can compare.',
    href: '/requests/new',
    cta: 'Post a project',
  },
  {
    label: 'For designers',
    title: 'Find your next project',
    body: 'Browse open projects from clients and send a proposal with your scope and fees.',
    href: '/open-projects',
    cta: 'See open projects',
  },
];

export default async function HomePage() {
  const designers = await fetchPublic<Paginated<DesignerSummary>>(
    '/designers?verifiedOnly=true&pageSize=3',
  );
  const featuredDesigners = designers?.items ?? [];

  return (
    <>
      <section className="shell pb-20 pt-36 md:pb-28 md:pt-44">
        <Reveal>
          <Badge tone="brand">Interior design marketplace</Badge>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-8 max-w-5xl font-display text-display font-semibold">
            Design the home you
            <span className="text-brand"> keep imagining.</span>
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <div className="mt-12 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <p className="max-w-lg text-lg text-muted">
              Brief your project once, compare proposals from verified
              designers, and manage the work through to handover - without
              losing the thread across a dozen conversations.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <ButtonLink href="/briefs/new" size="lg">
                Start a brief
              </ButtonLink>
              <ButtonLink href="/designers" size="lg" variant="outline">
                Browse designers
              </ButtonLink>
            </div>
          </div>
        </Reveal>
        <Reveal delay={240}>
          <HeroSearch />
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="label mr-2 text-muted">Popular styles</span>
            {styles.map((style) => (
              <Link
                key={style}
                href={`/portfolios?style=${encodeURIComponent(style)}`}
                className="rounded-full border border-hairline px-4 py-1.5 text-sm transition-colors duration-300 hover:border-brand hover:text-brand"
              >
                {style}
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      <Reveal>
        <div className="shell">
          <RoomHotspots
            src={heroImage}
            alt="A bright living room with arched windows, a painted brick fireplace and layered seating"
            imageAspect={heroImageAspect}
            hotspots={heroHotspots}
          />
        </div>
      </Reveal>

      <section className="shell py-20 md:py-28">
        <div className="grid gap-10 rounded-card bg-brand px-8 py-12 text-canvas sm:grid-cols-3 md:px-16 md:py-16">
          {stats.map((stat, index) => (
            <Reveal key={stat.caption} delay={index * 100}>
              <p className="font-display text-5xl font-semibold md:text-6xl">
                {stat.value}
              </p>
              <p className="mt-3 text-label font-semibold uppercase text-canvas/75">
                {stat.caption}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="shell pb-24 md:pb-32">
        <Reveal>
          <Badge tone="brand">Browse by room</Badge>
        </Reveal>
        <Reveal delay={60}>
          <h2 className="mt-6 max-w-xl font-display text-section font-semibold">
            Start with the space you have.
          </h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {rooms.map((room, index) => (
            <Reveal key={room.name} delay={(index % 4) * 80}>
              <Link
                href={`/portfolios?roomType=${encodeURIComponent(room.name)}`}
                className={`group flex h-full min-h-32 flex-col justify-between rounded-card ${room.tone} p-6 transition-transform duration-500 ease-editorial hover:-translate-y-1`}
              >
                <span className="font-display text-xl font-semibold transition-colors duration-300 group-hover:text-brand">
                  {room.name}
                </span>
                <span className="label mt-6 text-muted">View work</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="shell pb-24 md:pb-32">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Reveal>
            <div>
              <Badge tone="brand">Selected work</Badge>
              <h2 className="mt-6 max-w-xl font-display text-section font-semibold">
                Rooms that earned their brief.
              </h2>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <Link href="/portfolios" className="label link-underline text-ink">
              View all work
            </Link>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-8 md:mt-20 md:grid-cols-12">
          <Reveal className="md:col-span-7">
            <WorkCard
              work={featuredWork[0]}
              sizes="(min-width: 768px) 58vw, 100vw"
            />
          </Reveal>
          <Reveal delay={120} className="md:col-span-5 md:pt-16">
            <WorkCard
              work={featuredWork[1]}
              sizes="(min-width: 768px) 40vw, 100vw"
            />
          </Reveal>
          <Reveal className="md:col-span-5">
            <WorkCard
              work={featuredWork[2]}
              sizes="(min-width: 768px) 40vw, 100vw"
            />
          </Reveal>
          <Reveal delay={120} className="md:col-span-7 md:pt-16">
            <WorkCard
              work={featuredWork[3]}
              sizes="(min-width: 768px) 58vw, 100vw"
            />
          </Reveal>
        </div>
      </section>

      <section className="bg-sand py-24 md:py-32">
        <div className="shell">
          <Reveal>
            <Badge className="bg-canvas">How it works</Badge>
          </Reveal>
          <Reveal delay={60}>
            <h2 className="mt-6 max-w-2xl font-display text-section font-semibold">
              Three steps, start to handover.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-6 md:mt-20 md:grid-cols-3">
            {steps.map((step, index) => (
              <Reveal key={step.number} delay={index * 100}>
                <div
                  className={`h-full rounded-card ${step.tone} p-8 transition-transform duration-500 ease-editorial hover:-translate-y-1 md:p-10`}
                >
                  <p className="font-display text-5xl font-semibold text-brand">
                    {step.number}
                  </p>
                  <h3 className="mt-8 font-display text-2xl font-semibold">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-muted">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {featuredDesigners.length > 0 ? (
        <section className="shell py-24 md:py-32">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <Reveal>
              <div>
                <Badge tone="support">Featured designers</Badge>
                <h2 className="mt-6 max-w-xl font-display text-section font-semibold">
                  Verified and ready for your brief.
                </h2>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <Link href="/designers" className="label link-underline text-ink">
                Browse all designers
              </Link>
            </Reveal>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredDesigners.map((designer, index) => (
              <Reveal key={designer.id} delay={index * 100}>
                <DesignerCard designer={designer} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-label="Promotions" className="shell pt-16 md:pt-20">
        <div className="grid gap-4 md:grid-cols-3">
          {promotions.map((promo) => (
            <Link
              key={promo.title}
              href={promo.href}
              className="group flex flex-col gap-4 rounded-card border border-hairline bg-surface p-6 transition-colors duration-300 hover:border-brand md:p-8"
            >
              <div>
                <Badge tone="highlight">{promo.label}</Badge>
                <p className="mt-3 font-display text-xl font-semibold">
                  {promo.title}
                </p>
                <p className="mt-1 text-sm text-muted">{promo.body}</p>
              </div>
              <span className="label link-underline self-start text-ink group-hover:text-brand">
                {promo.cta}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="shell grid items-center gap-14 py-24 md:grid-cols-2 md:py-32">
        <Reveal>
          <div className="relative aspect-[4/5] overflow-hidden rounded-card shadow-card">
            <Image
              src={spotlightImage}
              alt="A designer reviewing material samples"
              fill
              sizes="(min-width: 768px) 46vw, 100vw"
              className="object-cover"
            />
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="md:pl-6">
            <Badge tone="support">Verified designers</Badge>
            <h2 className="mt-6 font-display text-section font-semibold">
              Credentials checked before the first message.
            </h2>
            <p className="mt-8 max-w-md text-lg text-muted">
              Every designer submits proof of qualification and past work for
              review. Payments sit against approved milestones, so money moves
              only when a stage is genuinely signed off.
            </p>
            <Link
              href="/how-it-works"
              className="label link-underline mt-10 inline-block text-ink"
            >
              How verification works
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="bg-sand py-24 md:py-32">
        <div className="shell">
          <Reveal>
            <Badge className="bg-canvas">Client stories</Badge>
          </Reveal>
          <Reveal delay={60}>
            <h2 className="mt-6 max-w-2xl font-display text-section font-semibold">
              What clients say after handover.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {testimonials.map((item, index) => (
              <Reveal key={item.name} delay={index * 100}>
                <figure className="flex h-full flex-col rounded-card bg-canvas p-8">
                  <blockquote className="font-display text-xl">
                    &ldquo;{item.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-auto pt-8">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted">{item.detail}</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="shell grid gap-10 py-24 md:grid-cols-[1fr_2fr] md:py-32">
        <Reveal>
          <div>
            <Badge tone="brand">FAQ</Badge>
            <h2 className="mt-6 font-display text-section font-semibold">
              Questions, answered.
            </h2>
          </div>
        </Reveal>
        <div className="divide-y divide-hairline border-y border-hairline">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-xl font-semibold">
                {faq.question}
                <span
                  aria-hidden
                  className="text-2xl text-brand transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-4 max-w-2xl text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="shell pb-28 md:pb-36">
        <div className="rounded-card bg-ink px-8 py-20 text-center text-canvas md:px-16 md:py-28">
          <Reveal>
            <h2 className="mx-auto max-w-3xl font-display text-section font-semibold">
              Start with the room you keep rearranging.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              <ButtonLink href="/briefs/new" size="lg">
                Start a brief
              </ButtonLink>
              <ButtonLink href="/register" size="lg" variant="onDark">
                Join as a designer
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function WorkCard({
  work,
  sizes,
}: {
  work: (typeof featuredWork)[number];
  sizes: string;
}) {
  return (
    <Link href="/portfolios" className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-sand shadow-card">
        <Image
          src={work.src}
          alt={work.title}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04]"
        />
      </div>
      <div className="mt-5 flex items-baseline justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl font-semibold transition-colors duration-300 group-hover:text-brand">
            {work.title}
          </h3>
          <p className="mt-1 text-muted">Illustrative project</p>
        </div>
        <Badge className="whitespace-nowrap">{work.style}</Badge>
      </div>
    </Link>
  );
}
