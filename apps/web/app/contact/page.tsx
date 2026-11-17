import type { Metadata } from 'next';
import { Clock, LifeBuoy, Palette } from 'lucide-react';
import { ContactForm } from '@/components/features/contact/contact-form';
import { cardSurface } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = {
  title: 'Contact us',
  description:
    'Questions about Inside, help with a project, or joining as a designer. Send us a message.',
};

const notes = [
  {
    icon: Clock,
    title: 'Quick replies',
    body: 'We answer most messages within one working day.',
  },
  {
    icon: LifeBuoy,
    title: 'Project help',
    body: 'Stuck on a stage, payment or proposal? Tell us the project name and we will look into it.',
  },
  {
    icon: Palette,
    title: 'For designers',
    body: 'Ask about verification, your portfolio or partnering with Inside.',
  },
];

export default function ContactPage() {
  return (
    <div className="page">
      <section className="shell">
        <PageHeader
          eyebrow="Contact us"
          title="We would love to hear from you."
          description="Questions, feedback or help with a project. Send a message and the Inside team will get back to you."
        />
      </section>

      <section className="shell mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <ul className="flex flex-col gap-4">
          {notes.map(({ icon: Icon, title, body }) => (
            <li key={title} className={cn(cardSurface, 'flex gap-4 p-5')}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand text-brand">
                <Icon aria-hidden className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-1 text-sm text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ul>
        <ContactForm />
      </section>
    </div>
  );
}
