import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Reveal } from '@/components/reveal';

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
    tone: 'bg-ochre-soft',
  },
  {
    number: '02',
    title: 'Get matched',
    body: 'We rank designers against your brief by style, room type, budget fit and availability. You can also invite a specific designer directly.',
    tone: 'bg-sage-soft',
  },
  {
    number: '03',
    title: 'Compare proposals',
    body: 'Each proposal carries scope, cost and a timeline in weeks. Read them side by side, then accept the one that fits.',
    tone: 'bg-clay-soft',
  },
  {
    number: '04',
    title: 'Work in stages',
    body: 'Accepted proposals become a project split into stages — concept, design, revision, completion. Each stage is submitted and approved in the workspace.',
    tone: 'bg-ochre-soft',
  },
  {
    number: '05',
    title: 'Pay per milestone',
    body: 'Payments sit against approved stages. Money is released as work is genuinely signed off, not up front.',
    tone: 'bg-sage-soft',
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
    body: 'Reject a stage and ask for revisions, put a project on hold, or cancel — the status is always explicit.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="py-32 md:py-40">
      <section className="shell">
        <PageHeader
          eyebrow="How it works"
          title="From first brief to final handover."
          description="Inside structures the messy middle of an interior project into stages you can actually track."
          action={
            <ButtonLink href="/briefs/new" size="lg">
              Start a brief
            </ButtonLink>
          }
        />
      </section>

      <section className="shell mt-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stages.map((stage, index) => (
            <Reveal key={stage.number} delay={index * 80}>
              <div className={`h-full rounded-card ${stage.tone} p-8 md:p-10`}>
                <p className="font-display text-5xl font-semibold text-clay">
                  {stage.number}
                </p>
                <h2 className="mt-8 font-display text-2xl font-semibold">
                  {stage.title}
                </h2>
                <p className="mt-4 text-muted">{stage.body}</p>
              </div>
            </Reveal>
          ))}
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
          <h2 className="mx-auto max-w-2xl font-display text-section font-semibold">
            Ready when your room is.
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <ButtonLink href="/briefs/new" size="lg">
              Start a brief
            </ButtonLink>
            <ButtonLink href="/designers" size="lg" variant="onDark">
              Browse designers
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
