'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VisualPicker } from '@/components/layout/visual-picker';
import { formatApiError } from '@/lib/api/auth';
import { createBrief, getBrief, updateBrief } from '@/lib/api/briefs';
import { listMoodboards } from '@/lib/api/moodboards';
import type { Brief, Moodboard } from '@/lib/api/types';
import {
  BUDGET_BANDS,
  ROOM_OPTIONS,
  STYLE_OPTIONS,
  type TaxonomyOption,
} from '@/lib/taxonomy';
import { cn } from '@/lib/utils';

const STEPS = [
  { title: 'Style', hint: 'Pick the looks that feel right.' },
  { title: 'Rooms', hint: 'Which spaces are in scope?' },
  { title: 'Budget', hint: 'Set a range and add context.' },
  { title: 'Review', hint: 'Check the brief, then match designers.' },
] as const;

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1615529328331-f8917597711f?auto=format&fit=crop&w=600&q=80';

type BriefWizardProps = {
  mode: 'create' | 'edit';
};

/** Keeps custom values selectable alongside the curated taxonomy tiles. */
function withCustom(
  options: readonly TaxonomyOption[],
  values: readonly string[],
): TaxonomyOption[] {
  const known = new Set(options.map((option) => option.label));
  const extras = values
    .filter((value) => !known.has(value))
    .map((value) => ({ label: value, image: FALLBACK_IMAGE }));
  return [...options, ...extras];
}

export function BriefWizard({ mode }: BriefWizardProps) {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [styles, setStyles] = useState<string[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [customStyle, setCustomStyle] = useState('');
  const [customRoom, setCustomRoom] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [description, setDescription] = useState('');
  const [moodboardId, setMoodboardId] = useState(
    searchParams.get('moodboardId') ?? '',
  );
  const [moodboards, setMoodboards] = useState<Moodboard[]>([]);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(mode === 'edit');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styleOptions = useMemo(
    () => withCustom(STYLE_OPTIONS, styles),
    [styles],
  );
  const roomOptions = useMemo(() => withCustom(ROOM_OPTIONS, rooms), [rooms]);

  useEffect(() => {
    void listMoodboards()
      .then((data) => setMoodboards(data.items))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !params.id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getBrief(params.id!);
        if (cancelled) return;
        const b = data.brief;
        setBrief(b);
        setStyles(b.styles);
        setRooms(b.rooms);
        setBudgetRange(b.budgetRange ?? '');
        setDescription(b.description ?? '');
        setMoodboardId(b.moodboardId ?? '');
      } catch (err) {
        if (!cancelled) setError(formatApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, params.id]);

  function toggle(list: string[], value: string): string[] {
    return list.includes(value)
      ? list.filter((item) => item !== value)
      : [...list, value];
  }

  function addCustom(kind: 'style' | 'room') {
    const raw = kind === 'style' ? customStyle : customRoom;
    const value = raw.trim();
    if (!value) return;
    if (kind === 'style') {
      setStyles((prev) => (prev.includes(value) ? prev : [...prev, value]));
      setCustomStyle('');
    } else {
      setRooms((prev) => (prev.includes(value) ? prev : [...prev, value]));
      setCustomRoom('');
    }
    setError(null);
  }

  function next() {
    if (step === 0 && styles.length === 0) {
      setError('Pick at least one style.');
      return;
    }
    if (step === 1 && rooms.length === 0) {
      setError('Pick at least one room.');
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function onSubmit() {
    if (styles.length === 0 || rooms.length === 0) {
      setError('Styles and rooms are required.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const shared = {
        styles,
        rooms,
        budgetRange: budgetRange.trim() || undefined,
        description: description.trim() || undefined,
      };
      if (mode === 'edit' && params.id) {
        const data = await updateBrief(params.id, {
          ...shared,
          moodboardId: moodboardId ? moodboardId : null,
        });
        setBrief(data.brief);
        router.push(`/client/briefs/${data.brief.id}/match`);
      } else {
        const data = await createBrief({
          ...shared,
          ...(moodboardId ? { moodboardId } : {}),
        });
        router.push(`/client/briefs/${data.brief.id}/match`);
      }
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading brief…</p>;
  }

  if (mode === 'edit' && !brief && error) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
        <Link
          href="/client/briefs"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Back
        </Link>
      </div>
    );
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Client · Brief · Step {step + 1} of {STEPS.length}
        </p>
        <h1 className="font-heading text-3xl tracking-tight md:text-4xl">
          {STEPS[step].title}
        </h1>
        <p className="text-base text-muted-foreground">{STEPS[step].hint}</p>
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {step === 0 ? (
        <div className="space-y-4">
          <VisualPicker
            options={styleOptions}
            selected={styles}
            onToggle={(label) => setStyles((prev) => toggle(prev, label))}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="custom-style">Add another style</Label>
              <Input
                id="custom-style"
                value={customStyle}
                onChange={(e) => setCustomStyle(e.target.value)}
                placeholder="Japandi"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => addCustom('style')}
            >
              Add
            </Button>
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4">
          <VisualPicker
            options={roomOptions}
            selected={rooms}
            onToggle={(label) => setRooms((prev) => toggle(prev, label))}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="custom-room">Add another room</Label>
              <Input
                id="custom-room"
                value={customRoom}
                onChange={(e) => setCustomRoom(e.target.value)}
                placeholder="Balcony"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => addCustom('room')}
            >
              Add
            </Button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Budget band
            </p>
            <div className="flex flex-wrap gap-2">
              {BUDGET_BANDS.map((band) => {
                const active = budgetRange === band.range;
                return (
                  <button
                    key={band.label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setBudgetRange(active ? '' : band.range)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm transition-colors',
                      active
                        ? 'border-transparent bg-primary text-primary-foreground'
                        : 'border-border/70 bg-card/70 text-muted-foreground hover:border-primary/40 hover:text-foreground',
                    )}
                  >
                    {band.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Custom range (LKR)</Label>
            <Input
              id="budget"
              value={budgetRange}
              onChange={(e) => setBudgetRange(e.target.value)}
              placeholder="400000-800000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Anything else designers should know?</Label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Open plan apartment, lots of natural light, two kids…"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="moodboard">Linked moodboard</Label>
            <select
              id="moodboard"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              value={moodboardId}
              onChange={(e) => setMoodboardId(e.target.value)}
            >
              <option value="">None</option>
              {moodboards.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <dl className="surface-panel divide-y divide-border/60 p-5 text-sm">
          <div className="flex flex-wrap justify-between gap-3 pb-3">
            <dt className="text-muted-foreground">Styles</dt>
            <dd className="font-medium">{styles.join(', ') || '—'}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-3 py-3">
            <dt className="text-muted-foreground">Rooms</dt>
            <dd className="font-medium">{rooms.join(', ') || '—'}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-3 py-3">
            <dt className="text-muted-foreground">Budget</dt>
            <dd className="font-medium">{budgetRange.trim() || '—'}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-3 py-3">
            <dt className="text-muted-foreground">Notes</dt>
            <dd className="max-w-sm text-right">{description.trim() || '—'}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-3 pt-3">
            <dt className="text-muted-foreground">Moodboard</dt>
            <dd className="font-medium">
              {moodboards.find((m) => m.id === moodboardId)?.name ?? 'None'}
            </dd>
          </div>
        </dl>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {step > 0 ? (
          <Button type="button" variant="outline" onClick={back}>
            Back
          </Button>
        ) : (
          <Link
            href="/client/briefs"
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            Cancel
          </Link>
        )}
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={next}>
            Continue
          </Button>
        ) : (
          <Button type="button" disabled={pending} onClick={onSubmit}>
            {pending
              ? 'Saving…'
              : mode === 'edit'
                ? 'Save & match'
                : 'Create & match'}
          </Button>
        )}
      </div>
    </div>
  );
}
