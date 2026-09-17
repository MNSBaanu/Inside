import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/reveal';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { featuredWork, heroImage, spotlightImage } from '@/lib/images';

const steps = [
  {
    number: '01',
    title: 'Write your brief',
    body: 'Describe the space, the budget and the feeling you are after. Add a moodboard if you already have one.',
    tone: 'bg-ochre-soft',
  },
  {
    number: '02',
    title: 'Compare proposals',
    body: 'Verified designers respond with scope, timeline and cost. Read them side by side before you commit.',
    tone: 'bg-sage-soft',
  },
  {
    number: '03',
    title: 'Work in one place',
    body: 'Track stages, approve deliverables and release milestone payments as the work actually completes.',
    tone: 'bg-clay-soft',
  },
];

const stats = [
  { value: '240+', caption: 'Verified designers' },
  { value: '1,800', caption: 'Rooms completed' },
  { value: '4.8', caption: 'Average rating' },
];

export default function HomePage() {
  return (
    <>
      <section className="shell pb-20 pt-36 md:pb-28 md:pt-44">
        <Reveal>
          <Badge tone="clay">Interior design marketplace</Badge>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-8 max-w-5xl font-display text-display font-semibold">
            Design the home you
            <span className="text-clay"> keep imagining.</span>
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <div className="mt-12 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <p className="max-w-lg text-lg text-muted">
              Brief your project once, compare proposals from verified
              designers, and manage the work through to handover — without
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
      </section>

      <Reveal>
        <div className="shell">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-card shadow-lift md:aspect-[21/9]">
            <Image
              src={heroImage}
              alt="A finished interior project"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </div>
      </Reveal>

      <section className="shell py-20 md:py-28">
        <div className="grid gap-10 rounded-card bg-clay px-8 py-12 text-canvas sm:grid-cols-3 md:px-16 md:py-16">
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
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Reveal>
            <div>
              <Badge tone="clay">Selected work</Badge>
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
                  <p className="font-display text-5xl font-semibold text-clay">
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
            <Badge tone="sage">Verified designers</Badge>
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
    <Link href={`/portfolios/${work.id}`} className="group block">
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
          <h3 className="font-display text-2xl font-semibold transition-colors duration-300 group-hover:text-clay">
            {work.title}
          </h3>
          <p className="mt-1 text-muted">{work.designer}</p>
        </div>
        <Badge className="whitespace-nowrap">{work.style}</Badge>
      </div>
    </Link>
  );
}
