'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/layout/empty-state';
import { formatApiError } from '@/lib/api/auth';
import { generateBriefFromMoodboard } from '@/lib/api/briefs';
import { createMoodboard, deleteMoodboard, listMoodboards } from '@/lib/api/moodboards';
import type { Moodboard } from '@/lib/api/types';
import { DEMO_INSPO_2 } from '@/lib/media';
import { cn } from '@/lib/utils';

function CoverCollage({ board }: { board: Moodboard }) {
  const images = board.savedItems.slice(0, 3).map((item) => item.imageUrl);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center bg-muted text-sm text-muted-foreground">
        Empty board
      </div>
    );
  }

  return (
    <div className="grid aspect-[16/10] grid-cols-3 gap-0.5 bg-muted">
      {images.map((src, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${src}-${index}`}
          src={src}
          alt=""
          loading="lazy"
          className={cn(
            'h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]',
            images.length === 1 && 'col-span-3',
            images.length === 2 && index === 0 && 'col-span-2',
          )}
        />
      ))}
    </div>
  );
}

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

  async function onGenerateBrief(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const data = await generateBriefFromMoodboard(id);
      router.push(`/client/briefs/${data.brief.id}`);
    } catch (err) {
      setError(formatApiError(err));
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
          className="h-40 w-full object-cover md:h-56"
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
            Collect images and notes, then turn a board into a brief in one click.
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

      <ul className="grid gap-5 sm:grid-cols-2">
        {items.map((board) => (
          <li
            key={board.id}
            className="glass group overflow-hidden rounded-2xl transition-shadow hover:shadow-[0_22px_60px_-32px_oklch(0.22_0.02_145_/_0.55)]"
          >
            <Link href={`/client/moodboards/${board.id}`} className="block">
              <CoverCollage board={board} />
            </Link>
            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <Link
                  href={`/client/moodboards/${board.id}`}
                  className="font-heading text-lg tracking-tight hover:underline"
                >
                  {board.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {board.savedItems.length}{' '}
                  {board.savedItems.length === 1 ? 'image' : 'images'}
                  {board.briefCount != null
                    ? ` · ${board.briefCount} ${board.briefCount === 1 ? 'brief' : 'briefs'}`
                    : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/client/moodboards/${board.id}`}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                >
                  Open
                </Link>
                <Button
                  type="button"
                  size="sm"
                  disabled={busyId === board.id}
                  onClick={() => onGenerateBrief(board.id)}
                >
                  {busyId === board.id ? 'Working…' : 'Generate brief'}
                </Button>
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
        ))}
      </ul>
    </div>
  );
}
