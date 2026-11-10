import { cn } from '@/lib/utils/cn';
import { cardSurface } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/features/home/reveal';
import { DesignerCard } from '@/components/features/designers/designer-card';
import { HeroSearch } from '@/components/features/home/hero-search';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import {
  featuredWork,
  heroImage,
  spotlightImage,
} from '@/lib/utils/images';
import { fetchPublic } from '@/lib/api/server-api';
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
      'Posting a brief is free. You pay per milestone, after you approve each stage.',
  },
  {
    question: 'How are designers verified?',
    answer:
      'Designers submit proof of qualification and past work. An admin reviews it before the verified badge appears on their profile.',
  },
  {
    question: 'When is my payment released?',
    answer:
      'Once a milestone is paid, you release it to confirm you are happy with that stage of the work.',
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
    body: 'Track stages, approve deliverables and pay per milestone, all in one place.',
    tone: 'bg-brand-soft',
  },
];

const stats = [
  { value: 'Verified', caption: 'Designers checked before they join' },
  { value: 'Matched', caption: 'Briefs paired by style, room and budget' },
  { value: 'Staged', caption: 'Projects tracked in five clear stages' },
  { value: 'Secure', caption: 'Milestone payments through Stripe' },
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
      <section aria-labelledby="home-hero-title" className="shell pb-6 pt-24 md:pt-28">
        <div className="grid overflow-hidden rounded-2xl md:rounded-3xl border border-hairline bg-sand lg:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col justify-center px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-12">
            <p className="label text-brand">Your space. Your next chapter.</p>
            <h1 id="home-hero-title" className="mt-5 max-w-xl text-[clamp(2rem,4.2vw,3.75rem)] font-semibold leading-[1.06] tracking-[-0.02em]">
              A home that
              <span className="block text-brand">feels like you.</span>
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
              Discover spaces you love, find your designer, and bring it all
              together in one place.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/explore" size="lg">Explore spaces</ButtonLink>
              <ButtonLink href="/explore?tab=designers" size="lg" variant="outline">Find a designer</ButtonLink>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-ink/10 pt-4 text-sm">
              <span className="text-muted">Ready to make it happen?</span>
              <Link href="/briefs/new" className="font-semibold text-brand underline decoration-brand/30 underline-offset-4 hover:decoration-brand">
                Start your project <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
          <div className="relative h-[240px] bg-hairline sm:h-[300px] lg:h-auto lg:min-h-[440px]">
            <Image
              src={heroImage}
              alt="A bright living room with arched windows, layered seating and warm natural textures"
              fill
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-6 pb-7 pt-24 sm:px-8">
              <p className="label text-white/80">A little inspiration</p>
              <p className="mt-3 text-2xl font-medium tracking-tight text-white">Room to imagine more.</p>
              <Link href="/explore?roomType=Living%20Room" className="mt-3 inline-flex items-center gap-3 text-sm font-semibold text-white underline underline-offset-4 hover:text-white/80">
                Explore living rooms <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Find the right designer for your space</h2>
            <Link href="/projects" className="text-sm font-medium text-brand underline underline-offset-4">Go to my projects <span aria-hidden="true">&rarr;</span></Link>
          </div>
          <HeroSearch />
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="label mr-2 text-muted">Popular styles</span>
            {styles.map((style) => (
              <Link
                key={style}
                href={`/explore?style=${encodeURIComponent(style)}`}
                className="rounded-full border border-hairline px-4 py-1.5 text-sm transition-colors duration-300 hover:border-brand hover:text-brand"
              >
                {style}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="shell py-10 md:py-14">
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 rounded-card bg-brand px-4 py-6 text-canvas sm:gap-6 md:grid-cols-4 md:px-8 md:py-8">
          {stats.map((stat, index) => (
            <Reveal key={stat.caption} delay={index * 100}>
              <p className="font-display text-2xl font-semibold sm:text-3xl md:text-4xl">
                {stat.value}
              </p>
              <p className="mt-2 text-xs font-medium leading-relaxed text-canvas/80 sm:text-sm">
                {stat.caption}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="shell pb-12 md:pb-16">
        <Reveal>
          <Badge tone="brand">Browse by room</Badge>
        </Reveal>
        <Reveal delay={60}>
          <h2 className="mt-4 max-w-xl font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-tight tracking-tight font-semibold">
            Start with the space you have.
          </h2>
        </Reveal>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {rooms.map((room, index) => (
            <Reveal key={room.name} delay={(index % 4) * 80}>
              <Link
                href={`/explore?roomType=${encodeURIComponent(room.name)}`}
                className={`group flex h-full min-h-28 flex-col justify-between rounded-card ${room.tone} p-4 sm:p-5 transition-transform duration-500 ease-editorial hover:-translate-y-1`}
              >
                <span className="font-display text-base font-semibold sm:text-lg transition-colors duration-300 group-hover:text-brand">
                  {room.name}
                </span>
                <span className="label mt-6 text-muted">View work</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="shell pb-12 md:pb-16">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Reveal>
            <div>
              <Badge tone="brand">Selected work</Badge>
              <h2 className="mt-4 max-w-xl font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-tight tracking-tight font-semibold">
                Rooms that earned their brief.
              </h2>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <Link href="/explore" className="label link-underline text-ink">
              View all work
            </Link>
          </Reveal>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <Reveal className="min-w-0">
            <WorkCard
              work={featuredWork[0]}
              sizes="(min-width: 640px) 45vw, 100vw"
            />
          </Reveal>
          <Reveal delay={120} className="min-w-0">
            <WorkCard
              work={featuredWork[1]}
              sizes="(min-width: 640px) 45vw, 100vw"
            />
          </Reveal>
          <Reveal className="min-w-0">
            <WorkCard
              work={featuredWork[2]}
              sizes="(min-width: 640px) 45vw, 100vw"
            />
          </Reveal>
          <Reveal delay={120} className="min-w-0">
            <WorkCard
              work={featuredWork[3]}
              sizes="(min-width: 640px) 45vw, 100vw"
            />
          </Reveal>
        </div>
      </section>

      <section className="bg-sand py-12 md:py-16">
        <div className="shell">
          <Reveal>
            <Badge className="bg-canvas">How it works</Badge>
          </Reveal>
          <Reveal delay={60}>
            <h2 className="mt-4 max-w-2xl font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-tight tracking-tight font-semibold">
              Three steps, start to handover.
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {steps.map((step, index) => (
              <Reveal key={step.number} delay={index * 100}>
                <div
                  className={`h-full rounded-card ${step.tone} p-6 transition-transform duration-500 ease-editorial hover:-translate-y-1 md:p-7`}
                >
                  <p className="font-display text-3xl font-semibold text-brand">
                    {step.number}
                  </p>
                  <h3 className="mt-4 font-display text-xl font-semibold">
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
        <section className="shell py-12 md:py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <Reveal>
              <div>
                <Badge tone="support">Featured designers</Badge>
                <h2 className="mt-4 max-w-xl font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-tight tracking-tight font-semibold">
                  Verified and ready for your brief.
                </h2>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <Link href="/explore?tab=designers" className="label link-underline text-ink">
                Browse all designers
              </Link>
            </Reveal>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredDesigners.map((designer, index) => (
              <Reveal key={designer.id} delay={index * 100}>
                <DesignerCard designer={designer} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-label="Promotions" className="shell pt-10 md:pt-14">
        <div className="grid gap-4 md:grid-cols-3">
          {promotions.map((promo) => (
            <Link
              key={promo.title}
              href={promo.href}
              className={cn(cardSurface, 'group flex flex-col gap-4 p-6 transition-colors duration-300 hover:border-brand md:p-8')}
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

      <section className="shell grid items-center gap-8 py-12 md:grid-cols-2 md:py-16">
        <Reveal>
          <div className="relative h-[260px] sm:h-[320px] lg:h-[400px] overflow-hidden rounded-card shadow-card">
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
            <h2 className="mt-4 font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-tight tracking-tight font-semibold">
              Credentials checked before the first message.
            </h2>
            <p className="mt-5 max-w-md text-base text-muted">
              Every designer submits proof of qualification and past work for
              review. Payments sit against approved milestones, so money moves
              only when a stage is genuinely signed off.
            </p>
            <Link
              href="/how-it-works"
              className="label link-underline mt-6 inline-block text-ink"
            >
              How verification works
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="bg-sand py-12 md:py-16">
        <div className="shell">
          <Reveal>
            <Badge className="bg-canvas">Client stories</Badge>
          </Reveal>
          <Reveal delay={60}>
            <h2 className="mt-4 max-w-2xl font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-tight tracking-tight font-semibold">
              What clients say after handover.
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {testimonials.map((item, index) => (
              <Reveal key={item.name} delay={index * 100}>
                <figure className="flex h-full flex-col rounded-card bg-canvas p-6">
                  <blockquote className="font-display text-base leading-relaxed sm:text-lg">
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

      <section className="shell grid gap-6 py-12 lg:grid-cols-[1fr_2fr] md:py-16">
        <Reveal>
          <div>
            <Badge tone="brand">FAQ</Badge>
            <h2 className="mt-4 font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-tight tracking-tight font-semibold">
              Questions, answered.
            </h2>
          </div>
        </Reveal>
        <div className="divide-y divide-hairline border-y border-hairline">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base font-semibold sm:text-lg">
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

      <section className="shell pb-12 md:pb-16">
        <div className="rounded-card bg-ink px-5 py-10 text-center text-canvas md:px-10 md:py-14">
          <Reveal>
            <h2 className="mx-auto max-w-3xl font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-tight tracking-tight font-semibold">
              Start with the room you keep rearranging.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
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
    <Link href="/explore" className="group block">
      <div className="relative aspect-[3/2] overflow-hidden rounded-card bg-sand shadow-card">
        <Image
          src={work.src}
          alt={work.title}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04]"
        />
      </div>
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-semibold sm:text-xl transition-colors duration-300 group-hover:text-brand">
            {work.title}
          </h3>
          <p className="mt-1 text-sm text-muted">Illustrative project</p>
        </div>
        <Badge className="whitespace-nowrap">{work.style}</Badge>
      </div>
    </Link>
  );
}
