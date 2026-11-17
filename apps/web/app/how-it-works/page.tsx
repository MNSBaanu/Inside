import type { Metadata } from 'next';
import { Plus } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Reveal } from '@/components/features/home/reveal';
import { authImage, featuredWork, heroImage, spotlightImage } from '@/lib/utils/images';

export const metadata: Metadata = {
  title: 'How Inside works',
  description:
    'From brief to handover: how briefing, proposals, milestones and payments work on Inside.',
};

const stages = [
  {
    number: '01',
    title: 'Write your brief',
    body: 'Set out the room, the budget range, the timeline and the feeling you want. Attach a moodboard so designers can read your taste, not guess it.',
    image: authImage,
  },
  {
    number: '02',
    title: 'Get matched',
    body: 'We rank designers against your brief by style, room type, budget fit and availability. You can also invite a specific designer directly.',
    image: heroImage,
  },
  {
    number: '03',
    title: 'Compare proposals',
    body: 'Each proposal carries scope, cost and a timeline in weeks. Read them side by side, then accept the one that fits.',
    image: featuredWork[1].src,
  },
  {
    number: '04',
    title: 'Work in stages',
    body: 'Accepted proposals become a project split into stages - concept, design, revision, completion. Each stage is submitted and approved in the workspace.',
    image: spotlightImage,
  },
  {
    number: '05',
    title: 'Pay per milestone',
    body: 'Pay each milestone once its stage is approved, then release it to confirm you are happy with the work.',
    image: featuredWork[2].src,
  },
];

const assurances = [
  {
    title: 'Verified designers',
    body: 'Designers submit proof of qualification and past work. An admin reviews every submission before the verified badge appears.',
  },
  {
    title: 'Everything in one thread',
    body: 'Messages, deliverables, approvals and payments all live against the project, so nothing gets lost in email.',
  },
  {
    title: 'You stay in control',
    body: 'Reject a stage and ask for revisions, put a project on hold, or cancel - the status is always explicit.',
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
              Five stages,
              <br />
              one workspace
            </h2>
            <p className="mt-6 max-w-sm text-muted">
              Open a stage to see what happens and what you control at each step.
            </p>
          </Reveal>

          <Reveal delay={120} className="divide-y divide-ink/10">
            {stages.map((stage, index) => (
              <details key={stage.number} open={index === 0} className="group py-5 first:pt-0">
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
                <p className="mt-4 max-w-lg text-xs leading-relaxed text-muted">{stage.body}</p>
              </details>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="mt-24 bg-sand py-24 md:mt-32 md:py-32">
        <div className="shell">
          <Badge className="bg-canvas">What you can rely on</Badge>
          <h2 className="mt-6 max-w-2xl font-display text-section font-semibold">
            Structure, not good intentions.
          </h2>

          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {assurances.map((item, index) => (
              <Reveal key={item.title} delay={index * 80}>
                <h3 className="font-display text-2xl font-semibold">
                  {item.title}
                </h3>
                <p className="mt-4 text-muted">{item.body}</p>
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
