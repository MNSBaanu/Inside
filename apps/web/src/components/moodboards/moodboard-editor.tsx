'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUrlField } from '@/components/layout/image-url-field';
import { MasonryGrid } from '@/components/layout/masonry-grid';
import { formatApiError } from '@/lib/api/auth';
import { generateBriefFromMoodboard } from '@/lib/api/briefs';
import {
  addMoodboardItem,
  getMoodboard,
  removeMoodboardItem,
  updateMoodboard,
} from '@/lib/api/moodboards';
import type { Moodboard } from '@/lib/api/types';
import { DEMO_INSPO_1 } from '@/lib/media';
import { cn } from '@/lib/utils';

export function MoodboardEditor() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [board, setBoard] = useState<Moodboard | null>(null);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState(DEMO_INSPO_1);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getMoodboard(params.id);
        if (cancelled) return;
        setBoard(data.moodboard);
        setName(data.moodboard.name);
      } catch (err) {
        if (!cancelled) setError(formatApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function onSaveName(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const data = await updateMoodboard(params.id, { name: name.trim() });
      setBoard(data.moodboard);
      setMessage('Name saved.');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function onAddItem(event: React.FormEvent) {
    event.preventDefault();
    if (!imageUrl.trim()) {
      setError('Pick or paste an image first.');
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const data = await addMoodboardItem(params.id, {
        imageUrl: imageUrl.trim(),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      setBoard(data.moodboard);
      setNote('');
      setMessage('Added to board.');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onRemoveItem(index: number) {
    setBusy(true);
    setError(null);
    try {
      const data = await removeMoodboardItem(params.id, index);
      setBoard(data.moodboard);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onGenerateBrief() {
    setBusy(true);
    setError(null);
    try {
      const data = await generateBriefFromMoodboard(params.id);
      router.push(`/client/briefs/${data.brief.id}`);
    } catch (err) {
      setError(formatApiError(err));
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading moodboard…</p>;
  }

  if (!board) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive" role="alert">
          {error ?? 'Moodboard not found.'}
        </p>
        <Link
          href="/client/moodboards"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Back
        </Link>
      </div>
    );
  }

  const heroImage = board.savedItems[0]?.imageUrl ?? DEMO_INSPO_1;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImage}
          alt=""
          className="h-40 w-full object-cover md:h-56"
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,oklch(0.18_0.03_155_/_0.8)_0%,oklch(0.18_0.03_155_/_0.3)_78%)]" />
        <div className="absolute inset-0 flex flex-col justify-end gap-4 p-6 md:flex-row md:items-end md:justify-between md:p-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
              Client · Moodboard
            </p>
            <h1 className="mt-2 font-heading text-3xl tracking-tight text-white md:text-4xl">
              {board.name}
            </h1>
            <p className="mt-2 text-sm text-white/80">
              {board.savedItems.length}{' '}
              {board.savedItems.length === 1 ? 'image' : 'images'} · add notes,
              then turn it into a brief.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={busy}
              onClick={onGenerateBrief}
              className="bg-white text-[oklch(0.24_0.03_155)] hover:bg-white/90"
            >
              {busy ? 'Working…' : 'Generate brief'}
            </Button>
            <Link
              href="/client/moodboards"
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'text-white hover:bg-white/10 hover:text-white',
              )}
            >
              Back
            </Link>
          </div>
        </div>
      </section>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-primary" role="status">
          {message}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {board.savedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing saved yet — add your first inspiration image on the right.
            </p>
          ) : (
            <MasonryGrid className="sm:columns-2">
              {board.savedItems.map((item, index) => (
                <figure
                  key={`${item.imageUrl}-${index}`}
                  className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.note ?? `Item ${index + 1}`}
                    loading="lazy"
                    className="w-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => onRemoveItem(index)}
                    className="absolute right-2 top-2 bg-black/45 text-white opacity-0 transition-opacity hover:bg-black/65 hover:text-white focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    Remove
                  </Button>
                  {item.note ? (
                    <figcaption className="px-4 py-3 text-sm text-muted-foreground">
                      {item.note}
                    </figcaption>
                  ) : null}
                </figure>
              ))}
            </MasonryGrid>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <form onSubmit={onAddItem} className="surface-panel space-y-4 p-5">
            <h2 className="font-heading text-xl tracking-tight">
              Add inspiration
            </h2>
            <ImageUrlField
              id="imageUrl"
              label="Image"
              value={imageUrl}
              onChange={setImageUrl}
            />
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Input
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Warm neutrals, oak flooring…"
              />
            </div>
            <Button type="submit" disabled={busy} className="w-full justify-center">
              Add to board
            </Button>
          </form>

          <form onSubmit={onSaveName} className="surface-panel space-y-3 p-5">
            <div className="space-y-2">
              <Label htmlFor="name">Board name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              disabled={saving}
              className="w-full justify-center"
            >
              {saving ? 'Saving…' : 'Save name'}
            </Button>
          </form>
        </aside>
      </div>
    </div>
  );
}
