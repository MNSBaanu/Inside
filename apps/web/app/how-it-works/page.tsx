import type { Metadata } from 'next';
import { Plus } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Reveal } from '@/components/features/home/reveal';
import { howItWorksImages } from '@/lib/utils/images';

export const metadata: Metadata = {
  title: 'How Inside works',
  description:
    'From brief to handover: how briefing, proposals, milestones and payments work on Inside.',
};

const stages = [
  {
    number: '01',
    title: 'Open or invite',
    body: 'Post a brief to every designer, or send it straight to one designer you already like. A direct brief goes only to that designer, who can reply with a proposal or decline.',
    image: howItWorksImages[0],
  },
  {
    number: '02',
    title: 'How matching scores',
    body: 'Each designer gets a score out of 100: style 30, room type 25, budget fit 20, how well their work matches your description 15, and availability 10. You see the breakdown, not just the rank.',
    image: howItWorksImages[1],
  },
  {
    number: '03',
    title: 'Accepting closes the brief',
    body: 'When you accept a proposal, the brief closes and the other proposals are declined for you. Its stage fees become the project milestones.',
    image: howItWorksImages[2],
  },
  {
    number: '04',
    title: 'Submit, approve, move on',
    body: 'The designer submits each stage with its files. Approve it and the next stage starts. Send it back and it returns to the designer for changes.',
    image: howItWorksImages[3],
  },
  {
    number: '05',
    title: 'Paid, then released',
    body: 'Paying a milestone holds the money against the stage. Releasing it tells the designer the work is signed off.',
    image: howItWorksImages[4],
  },
];

const assurances = [
  {
    title: 'If you cancel',
    body: 'Milestones you paid but have not released are refunded to your card when the project is cancelled.',
  },
  {
    title: 'If something is wrong',
    body: 'Report a designer, portfolio, message or review. An admin reviews it, records the outcome and can remove the content.',
  },
  {
    title: 'If a designer is busy',
    body: 'Designers set the date they are next free. Sooner availability scores higher, so you are not matched with someone booked for months.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="page">
      <section className="shell">
        <PageHeader
          eyebrow="How it works"
          title="From first brief to final handover."
          description="Inside structures the messy middle of an interior project into stages you can actually track."
          action={
            <ButtonLink href="/briefs/new">
              Start a brief
            </ButtonLink>
          }
        />
      </section>

      <section aria-labelledby="stages-title" className="shell mt-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal className="flex flex-col">
            <h2
              id="stages-title"
              className="text-heading font-medium leading-[1.05] tracking-[-0.03em]"
            >
              What happens
              <br />
              behind each step
            </h2>
            <p className="mt-6 max-w-sm text-ink/70">
              The rules the platform follows, from the moment a brief goes out.
            </p>
          </Reveal>

          <Reveal delay={120} className="divide-y divide-ink/10">
            {stages.map((stage, index) => (
              <details key={stage.number} name="how-it-works-step" open={index === 0} className="group py-5 first:pt-0">
                <summary className="flex cursor-pointer list-none items-baseline gap-3">
                  <span className="text-xs text-ink/70">{stage.number}</span>
                  <span className="text-xl font-medium tracking-[-0.02em]">{stage.title}</span>
                  <Plus
                    aria-hidden
                    className="ml-auto h-4 w-4 shrink-0 self-center text-muted transition-transform duration-300 group-open:rotate-45"
                  />
                </summary>
                <div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-card">
                  <Image
                    src={stage.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <p className="mt-4 max-w-lg text-xs leading-relaxed text-ink/70">{stage.body}</p>
              </details>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="mt-24 bg-sand py-24 md:mt-32 md:py-32">
        <div className="shell">
          <Badge className="bg-canvas">When plans change</Badge>
          <h2 className="mt-6 max-w-2xl font-display text-section font-semibold">
            What happens if things don&apos;t go to plan.
          </h2>

          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {assurances.map((item, index) => (
              <Reveal key={item.title} delay={index * 80}>
                <h3 className="font-display text-2xl font-semibold">
                  {item.title}
                </h3>
                <p className="mt-4 text-ink/70">{item.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="shell mt-24 md:mt-32">
        <div className="rounded-card bg-ink px-8 py-20 text-center text-canvas md:px-16 md:py-24">
          <h2 className="mx-auto font-display text-section font-semibold">
            Ready when your room is.
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <ButtonLink href="/briefs/new" size="lg">
              Start a brief
            </ButtonLink>
            <ButtonLink href="/explore?tab=designers" size="lg" variant="onDark">
              Browse designers
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
