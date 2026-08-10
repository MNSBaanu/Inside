'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatApiError } from '@/lib/api/auth';
import { createBrief, getBrief, updateBrief } from '@/lib/api/briefs';
import { listMoodboards } from '@/lib/api/moodboards';
import type { Brief, Moodboard } from '@/lib/api/types';
import { cn } from '@/lib/utils';

const STEPS = ['Styles', 'Rooms', 'Budget', 'Review'] as const;

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

type BriefWizardProps = {
  mode: 'create' | 'edit';
};

export function BriefWizard({ mode }: BriefWizardProps) {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [styles, setStyles] = useState('');
  const [rooms, setRooms] = useState('');
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
        setStyles(b.styles.join(', '));
        setRooms(b.rooms.join(', '));
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

  function validateStep(): string | null {
    if (step === 0 && parseList(styles).length === 0) {
      return 'Add at least one style.';
    }
    if (step === 1 && parseList(rooms).length === 0) {
      return 'Add at least one room.';
    }
    return null;
  }

  function next() {
    const msg = validateStep();
    if (msg) {
      setError(msg);
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
    const styleList = parseList(styles);
    const roomList = parseList(rooms);
    if (styleList.length === 0 || roomList.length === 0) {
      setError('Styles and rooms are required.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const shared = {
        styles: styleList,
        rooms: roomList,
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
        <Link href="/client/briefs" className={cn(buttonVariants({ variant: 'outline' }))}>
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div className="space-y-2 border-b border-border/60 pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </p>
        <h1 className="font-heading text-3xl tracking-tight md:text-4xl">
          {mode === 'edit' ? 'Edit brief' : 'New brief'}
        </h1>
        <p className="text-muted-foreground">{STEPS[step]}</p>
      </div>

      <ol className="flex flex-wrap gap-2 text-sm">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={cn(
              'rounded-full px-3 py-1.5',
              index === step
                ? 'bg-primary text-primary-foreground'
                : index < step
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-muted/60 text-muted-foreground',
            )}
          >
            {label}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <div className="space-y-2">
          <Label htmlFor="styles">Styles (comma-separated)</Label>
          <Input
            id="styles"
            value={styles}
            onChange={(e) => setStyles(e.target.value)}
            placeholder="Scandinavian, Minimalist"
          />
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-2">
          <Label htmlFor="rooms">Rooms (comma-separated)</Label>
          <Input
            id="rooms"
            value={rooms}
            onChange={(e) => setRooms(e.target.value)}
            placeholder="Living Room, Kitchen"
          />
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="budget">Budget range</Label>
            <Input
              id="budget"
              value={budgetRange}
              onChange={(e) => setBudgetRange(e.target.value)}
              placeholder="400000-800000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Open plan apartment, natural light…"
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
        <div className="surface-panel space-y-3 p-5 text-sm">
          <p>
            <span className="text-muted-foreground">Styles:</span>{' '}
            {parseList(styles).join(', ') || '—'}
          </p>
          <p>
            <span className="text-muted-foreground">Rooms:</span>{' '}
            {parseList(rooms).join(', ') || '—'}
          </p>
          <p>
            <span className="text-muted-foreground">Budget:</span>{' '}
            {budgetRange.trim() || '—'}
          </p>
          <p>
            <span className="text-muted-foreground">Description:</span>{' '}
            {description.trim() || '—'}
          </p>
          <p>
            <span className="text-muted-foreground">Moodboard:</span>{' '}
            {moodboards.find((m) => m.id === moodboardId)?.name ?? 'None'}
          </p>
        </div>
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
