'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { Brief, Moodboard } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function MoodboardsPage() {
  const router = useRouter();
  const { data, error, loading, reload } =
    useApi<{ items: Moodboard[] }>('/moodboards');

  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onCreate(event: React.FormEvent) {
    event.preventDefault();
    setActionError(null);
    setBusy(true);
    try {
      await api.post('/moodboards', { name });
      setName('');
      await reload();
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function addItem(moodboardId: string) {
    const url = imageUrl[moodboardId];
    if (!url) return;
    setActionError(null);
    try {
      await api.post(`/moodboards/${moodboardId}/items`, { imageUrl: url });
      setImageUrl({ ...imageUrl, [moodboardId]: '' });
      await reload();
    } catch (cause) {
      setActionError(errorMessage(cause));
    }
  }

  async function removeItem(moodboardId: string, index: number) {
    setActionError(null);
    try {
      await api.delete(`/moodboards/${moodboardId}/items/${index}`);
      await reload();
    } catch (cause) {
      setActionError(errorMessage(cause));
    }
  }

  async function remove(moodboardId: string) {
    setActionError(null);
    try {
      await api.delete(`/moodboards/${moodboardId}`);
      await reload();
    } catch (cause) {
      setActionError(errorMessage(cause));
    }
  }

  async function generateBrief(moodboardId: string) {
    setActionError(null);
    try {
      const result = await api.post<{ brief: Brief }>(
        `/moodboards/${moodboardId}/briefs`,
        {},
      );
      router.push(`/briefs/${result.brief.id}`);
    } catch (cause) {
      setActionError(errorMessage(cause));
    }
  }

  return (
    <div>
      <Badge tone="brand">Moodboards</Badge>
      <h1 className="mt-6 font-display text-section font-semibold">
        Collect what you like.
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        Save images that capture the feeling you want, then turn a board into a
        brief in one step.
      </p>

      {actionError ? (
        <div className="mt-8">
          <ErrorNotice message={actionError} />
        </div>
      ) : null}

      <Card className="mt-12">
        <CardHeader title="New moodboard" />
        <form onSubmit={onCreate} className="flex flex-wrap items-end gap-4">
          <div className="min-w-64 flex-1">
            <Field label="Name" htmlFor="name">
              <Input
                id="name"
                required
                minLength={2}
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Calm living room"
              />
            </Field>
          </div>
          <Button type="submit" size="lg" disabled={busy}>
            {busy ? 'Creating…' : 'Create'}
          </Button>
        </form>
      </Card>

      <div className="mt-12">
        {error ? <ErrorNotice message={error} /> : null}

        {loading ? (
          <Skeleton className="h-48" />
        ) : data && data.items.length > 0 ? (
          <ul className="flex flex-col gap-8">
            {data.items.map((board) => (
              <li key={board.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="font-display text-2xl font-semibold">
                        {board.name}
                      </h2>
                      <p className="mt-1 text-sm text-muted">
                        {board.savedItems.length}{' '}
                        {board.savedItems.length === 1 ? 'image' : 'images'} ·
                        Created {formatDate(board.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button size="sm" onClick={() => generateBrief(board.id)}>
                        Turn into brief
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => remove(board.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {board.savedItems.length > 0 ? (
                    <ul className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                      {board.savedItems.map((item, index) => (
                        <li key={`${board.id}-${index}`}>
                          <div className="relative aspect-square overflow-hidden rounded-card bg-sand">
                            <Image
                              src={item.imageUrl}
                              alt={item.note ?? 'Moodboard image'}
                              fill
                              sizes="(min-width: 640px) 25vw, 100vw"
                              className="object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(board.id, index)}
                            className="mt-2 text-sm text-muted underline underline-offset-4 hover:text-brand"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-6 text-muted">No images on this board.</p>
                  )}

                  <div className="mt-8 flex flex-wrap items-end gap-4">
                    <div className="min-w-64 flex-1">
                      <Field
                        label="Add image URL"
                        htmlFor={`img-${board.id}`}
                        hint="Paste a link until uploads are available."
                      >
                        <Input
                          id={`img-${board.id}`}
                          type="url"
                          value={imageUrl[board.id] ?? ''}
                          onChange={(event) =>
                            setImageUrl({
                              ...imageUrl,
                              [board.id]: event.target.value,
                            })
                          }
                          placeholder="https://…"
                        />
                      </Field>
                    </div>
                    <Button size="sm" onClick={() => addItem(board.id)}>
                      Add
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        ) : !error ? (
          <EmptyState
            title="No moodboards yet."
            description="Create one above and start collecting images."
          />
        ) : null}
      </div>
    </div>
  );
}
