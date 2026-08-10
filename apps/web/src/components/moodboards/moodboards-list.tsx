'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { formatApiError } from '@/lib/api/auth';
import { createMoodboard, deleteMoodboard, listMoodboards } from '@/lib/api/moodboards';
import type { Moodboard } from '@/lib/api/types';
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
      <PageHeader
        eyebrow="Client · Inspiration"
        title="Moodboards"
        description="Collect images and notes, then turn them into a brief."
      />

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
