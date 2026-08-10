'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatApiError } from '@/lib/api/auth';
import { listBriefs } from '@/lib/api/briefs';
import { listFavourites } from '@/lib/api/favourites';
import { createRequest } from '@/lib/api/requests';
import type { Brief, Favourite, RequestType } from '@/lib/api/types';
import { cn } from '@/lib/utils';

const TYPES: { value: RequestType; title: string; copy: string }[] = [
  {
    value: 'OPEN',
    title: 'Open call',
    copy: 'Any available designer can send you a proposal.',
  },
  {
    value: 'DIRECT',
    title: 'Direct invite',
    copy: 'Only the designer you pick can respond.',
  },
];

export function CreateRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDesignerId = searchParams.get('designerId') ?? '';
  const [type, setType] = useState<RequestType>(
    initialDesignerId ? 'DIRECT' : 'OPEN',
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [designerId, setDesignerId] = useState(initialDesignerId);
  const [briefId, setBriefId] = useState(searchParams.get('briefId') ?? '');
  const [budget, setBudget] = useState('');
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listBriefs()
      .then((data) => setBriefs(data.items))
      .catch(() => undefined);
    void listFavourites()
      .then((data) => setFavourites(data.items))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const brief = briefs.find((b) => b.id === briefId);
    if (brief && !title) {
      setTitle(
        `${brief.rooms.slice(0, 2).join(' & ')} — ${brief.styles.slice(0, 2).join(', ')}`,
      );
    }
  }, [briefId, briefs, title]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (title.trim().length < 2) {
      setError('Add a title of at least 2 characters.');
      return;
    }
    if (type === 'DIRECT' && !designerId) {
      setError('Pick a designer for a direct invite.');
      return;
    }
    setPending(true);
    try {
      const data = await createRequest({
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        ...(type === 'DIRECT' ? { designerId } : {}),
        ...(briefId ? { briefId } : {}),
        ...(budget ? { budget: Number(budget) } : {}),
      });
      router.replace(`/client/requests/${data.request.id}`);
    } catch (err) {
      setError(formatApiError(err));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Client · Hiring
        </p>
        <h1 className="font-heading text-3xl tracking-tight md:text-4xl">
          New request
        </h1>
        <p className="text-muted-foreground">
          Describe the job. Designers reply with scope, timeline, and per-stage
          fees.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {TYPES.map((option) => {
          const active = type === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => setType(option.value)}
              className={cn(
                'rounded-2xl border p-5 text-left transition-all',
                active
                  ? 'border-primary bg-primary/5 shadow-[0_0_0_3px_oklch(0.38_0.06_155_/_0.12)]'
                  : 'border-border/60 hover:border-primary/40',
              )}
            >
              <p className="font-heading text-lg tracking-tight">
                {option.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {option.copy}
              </p>
            </button>
          );
        })}
      </div>

      <div className="surface-panel space-y-4 p-5">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Living room refresh"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Two-bedroom apartment, needs storage and softer lighting…"
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>

        {type === 'DIRECT' ? (
          <div className="space-y-2">
            <Label htmlFor="designerId">Designer</Label>
            {favourites.length > 0 ? (
              <select
                id="designerId"
                value={designerId}
                onChange={(e) => setDesignerId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="">Select a designer</option>
                {favourites.map((fav) => (
                  <option key={fav.designerId} value={fav.designerId}>
                    {fav.designer.name}
                  </option>
                ))}
                {designerId &&
                !favourites.some((f) => f.designerId === designerId) ? (
                  <option value={designerId}>Designer from portfolio</option>
                ) : null}
              </select>
            ) : (
              <Input
                id="designerId"
                value={designerId}
                onChange={(e) => setDesignerId(e.target.value)}
                placeholder="Designer id"
              />
            )}
            <p className="text-xs text-muted-foreground">
              Favourite a designer or open their portfolio to invite them
              directly.
            </p>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="briefId">Attach a brief</Label>
          <select
            id="briefId"
            value={briefId}
            onChange={(e) => setBriefId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">None</option>
            {briefs.map((brief) => (
              <option key={brief.id} value={brief.id}>
                {brief.styles.slice(0, 2).join(', ')} ·{' '}
                {brief.rooms.slice(0, 2).join(', ')}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget">Budget (optional, LKR)</Label>
          <Input
            id="budget"
            type="number"
            min={0}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="500000"
          />
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Posting…' : 'Post request'}
        </Button>
        <Link
          href="/client/requests"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
