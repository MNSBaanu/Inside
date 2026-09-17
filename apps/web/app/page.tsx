import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/reveal';
import { featuredWork, heroImage, spotlightImage } from '@/lib/images';

const steps = [
  {
    number: '01',
    title: 'Write your brief',
    body: 'Describe the space, the budget and the feeling you are after. Add a moodboard if you already have one.',
  },
  {
    number: '02',
    title: 'Compare proposals',
    body: 'Verified designers respond with scope, timeline and cost. Read them side by side before you commit.',
  },
  {
    number: '03',
    title: 'Work in one place',
    body: 'Track stages, approve deliverables and release milestone payments as the work actually completes.',
  },
];

export default function HomePage() {
  return (
    <>
      <section className="shell pb-16 pt-40 md:pb-24 md:pt-48">
        <Reveal>
          <p className="label">Interior design marketplace</p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-8 max-w-4xl font-display text-display">
            The right designer for the space you have in mind.
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <div className="mt-10 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <p className="max-w-md text-base text-muted">
              Brief your project once, compare proposals from verified
              designers, and manage the work through to handover — without
              losing the thread across a dozen conversations.
            </p>
            <div className="flex items-center gap-8">
              <Link
                href="/briefs/new"
                className="label bg-ink px-7 py-4 text-canvas transition-opacity duration-300 hover:opacity-85"
              >
                Start a brief
              </Link>
              <Link href="/designers" className="label link-underline text-ink">
                Browse designers
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <Reveal>
        <div className="relative aspect-[16/9] w-full overflow-hidden md:aspect-[21/9]">
          <Image
            src={heroImage}
            alt="A finished interior project"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </Reveal>

      <section className="shell py-24 md:py-36">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Reveal>
            <div>
              <p className="label">Selected work</p>
              <h2 className="mt-6 max-w-xl font-display text-4xl leading-tight tracking-tight md:text-5xl">
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

        <div className="mt-16 grid gap-x-8 gap-y-16 md:mt-24 md:grid-cols-12">
          <Reveal className="md:col-span-7">
            <WorkCard work={featuredWork[0]} sizes="(min-width: 768px) 58vw, 100vw" />
          </Reveal>
          <Reveal delay={120} className="md:col-span-4 md:col-start-9 md:pt-32">
            <WorkCard work={featuredWork[1]} sizes="(min-width: 768px) 33vw, 100vw" />
          </Reveal>
          <Reveal className="md:col-span-4 md:col-start-2">
            <WorkCard work={featuredWork[2]} sizes="(min-width: 768px) 33vw, 100vw" />
          </Reveal>
          <Reveal delay={120} className="md:col-span-5 md:col-start-7 md:pt-20">
            <WorkCard work={featuredWork[3]} sizes="(min-width: 768px) 42vw, 100vw" />
          </Reveal>
        </div>
      </section>

      <section className="border-y border-hairline">
        <div className="shell py-24 md:py-36">
          <Reveal>
            <p className="label">How it works</p>
          </Reveal>
          <div className="mt-16 grid gap-px bg-hairline md:grid-cols-3">
            {steps.map((step, index) => (
              <Reveal key={step.number} delay={index * 100}>
                <div className="h-full bg-canvas px-0 py-10 md:px-10 md:py-4">
                  <p className="font-display text-3xl text-muted">
                    {step.number}
                  </p>
                  <h3 className="mt-6 font-display text-2xl tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-4 max-w-sm text-sm text-muted">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="shell grid items-center gap-16 py-24 md:grid-cols-2 md:py-36">
        <Reveal>
          <div className="relative aspect-[4/5] overflow-hidden">
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
          <div className="md:pl-8">
            <p className="label">Verified designers</p>
            <h2 className="mt-6 font-display text-4xl leading-tight tracking-tight md:text-5xl">
              Credentials checked before the first message.
            </h2>
            <p className="mt-8 max-w-md text-base text-muted">
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

      <section className="border-t border-hairline">
        <div className="shell py-28 text-center md:py-40">
          <Reveal>
            <h2 className="mx-auto max-w-2xl font-display text-4xl leading-tight tracking-tight md:text-6xl">
              Start with the room you keep rearranging.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-12 flex flex-col items-center justify-center gap-8 sm:flex-row">
              <Link
                href="/briefs/new"
                className="label bg-ink px-7 py-4 text-canvas transition-opacity duration-300 hover:opacity-85"
              >
                Start a brief
              </Link>
              <Link href="/register" className="label link-underline text-ink">
                Join as a designer
              </Link>
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
      <div className="relative aspect-[3/4] overflow-hidden bg-hairline">
        <Image
          src={work.src}
          alt={work.title}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-5 flex items-baseline justify-between gap-4">
        <div>
          <h3 className="font-display text-xl tracking-tight">{work.title}</h3>
          <p className="mt-1 text-sm text-muted">{work.designer}</p>
        </div>
        <p className="label whitespace-nowrap">{work.style}</p>
      </div>
    </Link>
  );
}
