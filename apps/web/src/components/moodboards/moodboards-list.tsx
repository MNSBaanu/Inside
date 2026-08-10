'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/layout/empty-state';
import { formatApiError } from '@/lib/api/auth';
import { createMoodboard, deleteMoodboard, listMoodboards } from '@/lib/api/moodboards';
import type { Moodboard } from '@/lib/api/types';
import { DEMO_INSPO_2 } from '@/lib/media';
import { cn } from '@/lib/utils';

export function MoodboardsList() {
  const router = useRouter();
  const [items, setItems] = useState<Moodboard[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listMoodboards();
      setItems(data.items);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const data = await createMoodboard({ name: name.trim() });
      router.push(`/client/moodboards/${data.moodboard.id}`);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setCreating(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm('Delete this moodboard?')) return;
    setBusyId(id);
    setError(null);
    try {
      await deleteMoodboard(id);
      setItems((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={DEMO_INSPO_2}
          alt=""
          className="h-40 w-full object-cover md:h-52"
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,oklch(0.18_0.03_155_/_0.75)_0%,oklch(0.18_0.03_155_/_0.3)_75%)]" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
            Client · Inspiration
          </p>
          <h1 className="mt-2 font-heading text-3xl tracking-tight text-white md:text-4xl">
            Moodboards
          </h1>
          <p className="mt-2 max-w-lg text-sm text-white/80">
            Collect images and notes, then turn them into a brief.
          </p>
        </div>
      </section>

      <form
        onSubmit={onCreate}
        className="surface-panel flex flex-col gap-3 p-5 sm:flex-row sm:items-end"
      >
        <div className="flex-1 space-y-2">
          <Label htmlFor="moodboard-name">New moodboard</Label>
          <Input
            id="moodboard-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Apartment refresh"
          />
        </div>
        <Button type="submit" disabled={creating}>
          {creating ? 'Creating…' : 'Create'}
        </Button>
      </form>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading moodboards…</p>
      ) : null}

      {!loading && items.length === 0 ? (
        <EmptyState
          title="No moodboards yet"
          description="Start with a name — add inspiration images on the next screen."
        />
      ) : null}

      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((board) => {
          const cover = board.savedItems[0]?.imageUrl;
          return (
            <li key={board.id} className="surface-panel overflow-hidden">
              <div className="aspect-[16/9] bg-muted">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Empty board
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-heading text-lg tracking-tight">{board.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {board.savedItems.length} items
                    {board.briefCount != null
                      ? ` · ${board.briefCount} briefs`
                      : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/client/moodboards/${board.id}`}
                    className={cn(buttonVariants({ size: 'sm' }))}
                  >
                    Open
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busyId === board.id}
                    onClick={() => onDelete(board.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
