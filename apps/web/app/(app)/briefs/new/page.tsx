'use client';

import { Check, ChevronLeft, Pencil, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { BriefAssistant } from '@/components/features/briefs/brief-assistant';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/field';
import { ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { Tag } from '@/components/ui/tag';
import { TagInput } from '@/components/ui/tag-input';
import { api, errorMessage } from '@/lib/api/client';
import { useApi } from '@/lib/api/use-api';
import { cn } from '@/lib/utils/cn';
import type { Brief } from '@/lib/types';

const styleSuggestions = [
  'Scandinavian',
  'Minimalist',
  'Tropical Modern',
  'Mid-century',
  'Industrial',
  'Coastal',
];

const roomSuggestions = [
  'Living Room',
  'Kitchen',
  'Bedroom',
  'Bathroom',
  'Home Office',
  'Dining Room',
];

const STEPS = ['Rooms', 'Style', 'Budget & details', 'Review'] as const;
const AI_STEP = -1;

export default function NewBriefPage() {
  const router = useRouter();
  const assistant = useApi<{ enabled: boolean }>('/briefs/assistant');
  const assistantOn = assistant.data?.enabled === true;

  const [step, setStep] = useState(0);
  const [styles, setStyles] = useState<string[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState('');
  const [description, setDescription] = useState('');
  const [filledByAi, setFilledByAi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const startChosen = useRef(false);
  const statusKnown = assistant.data !== null || assistant.error !== null;

  useEffect(() => {
    if (!statusKnown || startChosen.current) return;
    startChosen.current = true;
    if (assistantOn) setStep(AI_STEP);
  }, [statusKnown, assistantOn]);

  function goTo(next: number) {
    setError(null);
    if (next > 0 && rooms.length === 0) {
      setError('Add at least one room so designers know what to quote for.');
      setStep(0);
      return;
    }
    if (budgetRange && !/\d/.test(budgetRange)) {
      setError('Enter the budget as numbers, e.g. 400000-800000.');
      setStep(2);
      return;
    }
    setStep(next);
  }

  async function create() {
    setError(null);
    if (rooms.length === 0) {
      setError('Add at least one room so designers know what to quote for.');
      setStep(0);
      return;
    }
    if (budgetRange && !/\d/.test(budgetRange)) {
      setError('Enter the budget as numbers, e.g. 400000-800000.');
      setStep(2);
      return;
    }
    setSubmitting(true);
    try {
      const data = await api.post<{ brief: Brief }>('/briefs', {
        styles,
        rooms,
        budgetRange: budgetRange || undefined,
        description: description || undefined,
      });
      router.replace(`/briefs/${data.brief.id}`);
    } catch (cause) {
      setError(errorMessage(cause));
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Link
        href="/briefs"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand"
      >
        <ChevronLeft aria-hidden className="h-4 w-4" />
        All briefs
      </Link>
      <PageHeader
        variant="app"
        eyebrow="New brief"
        title="Tell us about the space."
        description="The more specific you are, the closer the proposals will be to what you actually want."
      />

      {!statusKnown ? (
        <Skeleton className="mt-6 h-72" />
      ) : step === AI_STEP ? (
        <>
          <div className="mt-6 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-pill bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-deep">
              <Sparkles aria-hidden className="h-3.5 w-3.5" />
              AI brief assistant
            </span>
            <span className="text-sm text-muted">Fastest way to start</span>
          </div>
          <BriefAssistant
            onSuggest={(suggestion) => {
              if (suggestion.rooms.length > 0) setRooms(suggestion.rooms);
              if (suggestion.styles.length > 0) setStyles(suggestion.styles);
              if (suggestion.budgetRange) setBudgetRange(suggestion.budgetRange);
              if (suggestion.description) setDescription(suggestion.description);
              setFilledByAi(true);
              setStep(suggestion.rooms.length > 0 ? STEPS.length - 1 : 0);
            }}
          />
          <button
            type="button"
            onClick={() => setStep(0)}
            className="mt-4 text-sm font-semibold text-brand hover:underline"
          >
            Skip and fill it in step by step
          </button>
        </>
      ) : (
        <Card className="mt-6">
          <Stepper current={step} onSelect={goTo} />

          {error ? (
            <div className="mt-5">
              <ErrorNotice message={error} />
            </div>
          ) : null}

          {filledByAi && step === STEPS.length - 1 ? (
            <p className="mt-5 inline-flex items-center gap-1.5 rounded-pill bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-deep">
              <Sparkles aria-hidden className="h-3.5 w-3.5" />
              Filled in by the AI assistant. Check it and edit anything that is not right.
            </p>
          ) : null}

          <div className="mt-6">
            {step === 0 ? (
              <>
                <CardHeader
                  title="Which rooms are part of the project?"
                  description="Pick from the list or type your own and press Enter."
                />
                <Field label="Rooms" htmlFor="rooms" hint="At least one is required.">
                  <TagInput
                    id="rooms"
                    values={rooms}
                    onChange={setRooms}
                    placeholder="Living Room"
                    suggestions={roomSuggestions}
                  />
                </Field>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <CardHeader
                  title="What style are you drawn to?"
                  description="Optional, but it sharpens the designer match."
                />
                <Field label="Styles" htmlFor="styles" hint="Pick any that feel right.">
                  <TagInput
                    id="styles"
                    values={styles}
                    onChange={setStyles}
                    placeholder="Scandinavian"
                    suggestions={styleSuggestions}
                  />
                </Field>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <CardHeader
                  title="Budget and details"
                  description="A rough budget and a few lines about what you want help designers quote accurately."
                />
                <div className="flex flex-col gap-5">
                  <Field label="Budget range" htmlFor="budgetRange" hint="In LKR, e.g. 400000-800000.">
                    <Input
                      id="budgetRange"
                      maxLength={80}
                      value={budgetRange}
                      onChange={(event) => setBudgetRange(event.target.value)}
                      placeholder="400000-800000"
                    />
                  </Field>
                  <Field
                    label="Description"
                    htmlFor="description"
                    hint="What you want, what you dislike, and anything fixed."
                  >
                    <Textarea
                      id="description"
                      maxLength={4000}
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="We want the living room to feel calmer. Keeping the existing sofa and the teak cabinet."
                    />
                  </Field>
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <CardHeader
                  title="Review your brief"
                  description="Designers are matched on these details. You can edit the brief later too."
                />
                <dl className="divide-y divide-hairline rounded-card border border-hairline">
                  <ReviewRow label="Rooms" onEdit={() => goTo(0)}>
                    <TagList values={rooms} empty="None yet" />
                  </ReviewRow>
                  <ReviewRow label="Styles" onEdit={() => goTo(1)}>
                    <TagList values={styles} empty="Open to ideas" />
                  </ReviewRow>
                  <ReviewRow label="Budget" onEdit={() => goTo(2)}>
                    {budgetRange || <span className="text-muted">Not set</span>}
                  </ReviewRow>
                  <ReviewRow label="Description" onEdit={() => goTo(2)}>
                    {description ? (
                      <span className="whitespace-pre-line">{description}</span>
                    ) : (
                      <span className="text-muted">Not set</span>
                    )}
                  </ReviewRow>
                </dl>
              </>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-5">
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                step === 0
                  ? assistantOn
                    ? setStep(AI_STEP)
                    : router.push('/briefs')
                  : goTo(step - 1)
              }
            >
              {step === 0 ? (assistantOn ? 'Back to AI assistant' : 'Cancel') : 'Back'}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => goTo(step + 1)}>
                Next
              </Button>
            ) : (
              <Button type="button" onClick={create} disabled={submitting}>
                {submitting ? 'Creating…' : 'Create brief'}
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function Stepper({ current, onSelect }: { current: number; onSelect: (step: number) => void }) {
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Brief steps">
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label}>
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-current={active ? 'step' : undefined}
              className="group flex w-full flex-col gap-2 text-left"
            >
              <span
                aria-hidden
                className={cn(
                  'h-1.5 rounded-pill transition-colors',
                  done || active ? 'bg-brand' : 'bg-sand group-hover:bg-hairline',
                )}
              />
              <span
                className={cn(
                  'flex items-center gap-1 text-xs sm:text-sm',
                  active ? 'font-semibold text-ink' : 'text-muted',
                )}
              >
                {done ? <Check aria-hidden className="h-3.5 w-3.5 text-brand" /> : null}
                <span className="truncate">{label}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function ReviewRow({
  label,
  onEdit,
  children,
}: {
  label: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3.5">
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt>
        <dd className="mt-1.5 text-sm">{children}</dd>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${label.toLowerCase()}`}
        className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-sand hover:text-brand"
      >
        <Pencil aria-hidden className="h-4 w-4" />
      </button>
    </div>
  );
}

function TagList({ values, empty }: { values: string[]; empty: string }) {
  if (values.length === 0) return <span className="text-muted">{empty}</span>;
  return (
    <span className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <Tag key={value}>{value}</Tag>
      ))}
    </span>
  );
}
