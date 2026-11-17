'use client';

import { ChevronDown, Heart, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { FileUpload } from '@/components/ui/file-upload';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api, errorMessage } from '@/lib/api/client';
import { formatDate, formatMoney } from '@/lib/utils/format';
import { useApi } from '@/lib/api/use-api';
import type { Brief, Moodboard } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { isOptimizableImage } from '@/lib/utils/images';
import {
  StyleSummary,
  StyleWizard,
  hasStyle,
  hexOf,
} from '@/components/features/moodboards/style-wizard';
import { ShopPicker } from '@/components/features/moodboards/shop-picker';

export default function MoodboardsPage() {
  const router = useRouter();
  const { data, error, loading, reload } =
    useApi<{ items: Moodboard[] }>('/moodboards');

  const [name, setName] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmBoardId, setConfirmBoardId] = useState<string | null>(null);
  const [patched, setPatched] = useState<Record<string, Moodboard>>({});
  const [styleBoardId, setStyleBoardId] = useState<string | null>(null);
  const [shopBoardId, setShopBoardId] = useState<string | null>(null);

  useEffect(() => {
    setPatched({});
  }, [data]);

  async function patchBoard(
    board: Moodboard,
    changes: Partial<Pick<Moodboard, 'moodWords' | 'palette' | 'savedItems'>>,
  ) {
    setActionError(null);
    setPatched((current) => ({ ...current, [board.id]: { ...board, ...changes } }));
    try {
      await api.patch(`/moodboards/${board.id}`, changes);
    } catch (cause) {
      setActionError(errorMessage(cause));
      setPatched((current) => ({ ...current, [board.id]: board }));
    }
  }

  const styleSaved = data?.items.find((board) => board.id === styleBoardId);
  const styleBoard = styleSaved ? (patched[styleSaved.id] ?? styleSaved) : null;
  const shopBoard = data?.items.find((board) => board.id === shopBoardId) ?? null;

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

  async function addItem(moodboardId: string, url: string) {
    setActionError(null);
    try {
      await api.post(`/moodboards/${moodboardId}/items`, { imageUrl: url });
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
      <PageHeader
        variant="app"
        eyebrow="Moodboards"
        title="Collect what you like."
        description="Save images that capture the feeling you want, then turn a board into a brief in one step."
      />

      {actionError ? (
        <div className="mt-8">
          <ErrorNotice message={actionError} />
        </div>
      ) : null}


      {styleBoard ? (
        <StyleWizard
          board={styleBoard}
          onClose={() => setStyleBoardId(null)}
          onSave={(changes) => {
            setStyleBoardId(null);
            void patchBoard(styleBoard, changes);
          }}
        />
      ) : null}

      {confirmBoardId ? (
        <ConfirmDialog
          title="Delete this moodboard?"
          description="The board and its images will be removed. Briefs already made from it are kept. This cannot be undone."
          onCancel={() => setConfirmBoardId(null)}
          onConfirm={() => {
            const id = confirmBoardId;
            setConfirmBoardId(null);
            void remove(id);
          }}
        />
      ) : null}

      <Card className="mt-10">
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
          <ul className="flex flex-col gap-4">
            {data.items.map((saved) => {
              const board = patched[saved.id] ?? saved;
              const open = openId === board.id;
              return (
              <li key={board.id}>
                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : board.id)}
                      aria-expanded={open}
                      aria-controls={`board-${board.id}`}
                      className="group flex min-w-0 flex-1 items-center gap-4 text-left"
                    >
                      <ChevronDown
                        aria-hidden
                        className={`h-5 w-5 shrink-0 text-muted transition-transform duration-300 group-hover:text-brand ${open ? 'rotate-180' : ''}`}
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-display text-xl font-semibold group-hover:text-brand">
                          {board.name}
                        </span>
                        <span className="mt-1 block text-sm text-muted">
                          {board.savedItems.length}{' '}
                          {board.savedItems.length === 1 ? 'item' : 'items'} ·
                          Created {formatDate(board.createdAt)}
                          {board.moodWords.length > 0 ? ` · ${board.moodWords.join(', ')}` : ''}
                        </span>
                        {board.palette.length > 0 ? (
                          <span className="mt-2 flex gap-1" aria-hidden>
                            {board.palette.map((swatch) => (
                              <span
                                key={swatch}
                                className="h-3.5 w-3.5 rounded-full ring-1 ring-ink/10"
                                style={{ backgroundColor: hexOf(swatch) }}
                              />
                            ))}
                          </span>
                        ) : null}
                      </span>
                      {!open && board.savedItems.length > 0 ? (
                        <span className="ml-auto hidden -space-x-3 sm:flex" aria-hidden>
                          {board.savedItems.slice(0, 4).map((item, index) => (
                            <span
                              key={`${board.id}-thumb-${index}`}
                              className="relative h-10 w-10 overflow-hidden rounded-lg bg-sand ring-2 ring-surface"
                            >
                              <Image
                                src={item.imageUrl}
                                unoptimized={!isOptimizableImage(item.imageUrl)}
                                alt=""
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </span>
                          ))}
                        </span>
                      ) : null}
                    </button>
                    <div className="flex flex-wrap gap-3">
                      <Button size="sm" onClick={() => generateBrief(board.id)}>
                        Turn into brief
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmBoardId(board.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {open ? (
                  <div id={`board-${board.id}`}>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-card bg-sand/50 p-4">
                    <StyleSummary board={board} />
                    <Button
                      size="sm"
                      variant={hasStyle(board) ? 'outline' : 'primary'}
                      onClick={() => setStyleBoardId(board.id)}
                    >
                      {hasStyle(board) ? 'Edit your style' : 'Describe your style'}
                    </Button>
                  </div>

                  {board.savedItems.length > 0 ? (
                    <ul className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                      {board.savedItems.map((item, index) => (
                        <li key={`${board.id}-${index}`}>
                          <div className="relative aspect-square overflow-hidden rounded-card bg-sand">
                            <Image
                              src={item.imageUrl}
                              unoptimized={!isOptimizableImage(item.imageUrl)}
                              alt={item.note ?? 'Moodboard image'}
                              fill
                              sizes="(min-width: 640px) 25vw, 100vw"
                              className={`object-cover ${item.reaction === 'dislike' ? 'opacity-40 grayscale' : ''}`}
                            />
                            {item.reaction === 'love' ? (
                              <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-surface/90 text-error">
                                <Heart aria-hidden className="h-4 w-4 fill-current" />
                                <span className="sr-only">Loved</span>
                              </span>
                            ) : null}
                            {item.reaction === 'dislike' ? (
                              <span className="absolute bottom-2 left-2 rounded-pill bg-ink/80 px-2 py-0.5 text-xs text-canvas">
                                Not for me
                              </span>
                            ) : null}
                          </div>
                          {item.productSlug ? (
                            <div className="mt-2">
                              <Link
                                href={`/shop/${item.productSlug}`}
                                className="block truncate text-sm font-semibold hover:text-brand hover:underline"
                              >
                                {item.note ?? 'Shop item'}
                              </Link>
                              {item.productPrice !== undefined ? (
                                <p className="text-sm text-muted">{formatMoney(item.productPrice)}</p>
                              ) : null}
                            </div>
                          ) : null}
                          {item.loves?.length && item.reaction !== 'dislike' ? (
                            <p className="mt-1.5 text-xs text-muted">Loves: {item.loves.join(', ')}</p>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => removeItem(board.id, index)}
                            className="mt-1 inline-flex min-h-11 items-center text-sm text-muted underline underline-offset-4 hover:text-brand"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-6 text-muted">Nothing on this board yet.</p>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-8"
                    onClick={() => setShopBoardId(board.id)}
                  >
                    <ShoppingBag aria-hidden className="h-4 w-4" />
                    Add from shop
                  </Button>

                  <FileUpload
                    className="mt-6"
                    folder="moodboards"
                    label="Add an image"
                    onUploaded={(file) => void addItem(board.id, file.url)}
                  />
                  </div>
                  ) : null}
                </Card>
              </li>
              );
            })}
          </ul>
        ) : !error ? (
          <EmptyState
            title="No moodboards yet."
            description="Create one above and start collecting images."
          />
        ) : null}
      </div>
      {shopBoard ? (
        <ShopPicker
          moodboardId={shopBoard.id}
          savedSlugs={shopBoard.savedItems.flatMap((item) =>
            item.productSlug ? [item.productSlug] : [],
          )}
          onAdded={() => void reload()}
          onClose={() => setShopBoardId(null)}
        />
      ) : null}
    </div>
  );
}
