'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/page-header';
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
      setError('Image URL is required.');
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
      setMessage('Item added.');
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
        <Link href="/client/moodboards" className={cn(buttonVariants({ variant: 'outline' }))}>
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Moodboard editor"
        title={board.name}
        description={`${board.savedItems.length} inspiration items · add notes, then generate a brief.`}
        actions={
          <>
            <Button type="button" disabled={busy} onClick={onGenerateBrief}>
              {busy ? 'Working…' : 'Generate brief'}
            </Button>
            <Link
              href={`/client/briefs/new?moodboardId=${board.id}`}
              className={cn(buttonVariants({ variant: 'outline' }))}
            >
              New brief
            </Link>
            <Link
              href="/client/moodboards"
              className={cn(buttonVariants({ variant: 'ghost' }))}
            >
              Back
            </Link>
          </>
        }
      />

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <form
        onSubmit={onSaveName}
        className="surface-panel flex flex-col gap-3 p-5 sm:flex-row sm:items-end"
      >
        <div className="flex-1 space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save name'}
        </Button>
      </form>

      <form
        onSubmit={onAddItem}
        className="surface-panel grid gap-3 p-5 sm:grid-cols-2"
      >
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="note">Note</Label>
          <Input
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Warm neutrals, oak flooring…"
          />
        </div>
        <Button type="submit" disabled={busy} className="sm:col-span-2 sm:w-fit">
          Add item
        </Button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {board.savedItems.map((item, index) => (
          <figure
            key={`${item.imageUrl}-${index}`}
            className="surface-panel overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt={item.note ?? `Item ${index + 1}`}
              className="aspect-[4/3] w-full object-cover"
            />
            <figcaption className="space-y-2 p-3">
              <p className="text-sm text-muted-foreground">
                {item.note ?? 'No note'}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => onRemoveItem(index)}
              >
                Remove
              </Button>
            </figcaption>
          </figure>
        ))}
      </div>

      {board.savedItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">Add inspiration images above.</p>
      ) : null}
    </div>
  );
}
