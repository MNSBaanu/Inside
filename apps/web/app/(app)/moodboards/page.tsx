'use client';

import { ChevronDown, Heart, Plus, Search, ShoppingBag } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button, ButtonLink } from '@/components/ui/button';
import { cardSurface } from '@/components/ui/card';
import { Input } from '@/components/ui/field';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { FileUpload, type HashedUpload } from '@/components/ui/file-upload';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api, errorMessage } from '@/lib/api/client';
import { cn } from '@/lib/utils/cn';
import { formatDate, formatMoney } from '@/lib/utils/format';
import { useApi } from '@/lib/api/use-api';
import type { Moodboard } from '@/lib/types';
import { isOptimizableImage } from '@/lib/utils/images';
import {
  StyleSummary,
  StyleWizard,
  hasStyle,
  hexOf,
} from '@/components/features/moodboards/style-wizard';
import { ShopPicker } from '@/components/features/moodboards/shop-picker';
import { MoodboardWizard } from '@/components/features/moodboards/moodboard-wizard';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';

export default function MoodboardsPage() {
  const { data, error, loading, reload } =
    useApi<{ items: Moodboard[] }>('/moodboards');

  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmBoardId, setConfirmBoardId] = useState<string | null>(null);
  const [patched, setPatched] = useState<Record<string, Moodboard>>({});
  const [styleBoardId, setStyleBoardId] = useState<string | null>(null);
  const [shopBoardId, setShopBoardId] = useState<string | null>(null);
  const [editBoardId, setEditBoardId] = useState<string | null>(null);
  const [shownVersion, setShownVersion] = useState<Record<string, string>>({});

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
      if (board.status === 'APPROVED') await reload();
    } catch (cause) {
      setActionError(errorMessage(cause));
      setPatched((current) => ({ ...current, [board.id]: board }));
    }
  }

  const styleSaved = data?.items.find((board) => board.id === styleBoardId);
  const styleBoard = styleSaved ? (patched[styleSaved.id] ?? styleSaved) : null;
  const shopBoard = data?.items.find((board) => board.id === shopBoardId) ?? null;

  const editBoard = data?.items.find((board) => board.id === editBoardId) ?? null;

  const versionsByRoot = new Map<string, Moodboard[]>();
  for (const board of data?.items ?? []) {
    const root = board.parentId ?? board.id;
    versionsByRoot.set(root, [...(versionsByRoot.get(root) ?? []), board]);
  }
  const query = search.trim().toLowerCase();
  const groups = [...versionsByRoot.entries()]
    .map(([root, versions]) => ({
      root,
      versions: versions.sort((a, b) => b.version - a.version),
    }))
    .filter(({ versions }) => versions[0].name.toLowerCase().includes(query));

  async function addItems(board: Moodboard, files: HashedUpload[]) {
    setActionError(null);
    try {
      await api.patch(`/moodboards/${board.id}`, {
        savedItems: [
          ...board.savedItems,
          ...files.map((file) => ({ imageUrl: file.url, fileHash: file.fileHash })),
        ],
      });
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

  return (
    <div>
      <PageHeader
        variant="app"
        eyebrow="Moodboards"
        title="Collect what you like."
        description="Save images that capture the feeling you want, then turn a board into a brief so designers can see them."
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

      {creating || editBoard ? (
        <MoodboardWizard
          board={editBoard ?? undefined}
          onClose={() => {
            setCreating(false);
            setEditBoardId(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditBoardId(null);
            setShownVersion({});
            void reload();
          }}
        />
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          />
          <Input
            type="search"
            aria-label="Search moodboards"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search moodboards"
            className="pl-10"
          />
        </div>
        <Button size="lg" onClick={() => setCreating(true)}>
          <Plus aria-hidden className="h-4 w-4" />
          Create
        </Button>
      </div>

      <div className="mt-8">
        {error ? <ErrorNotice message={error} /> : null}

        {loading ? (
          <Skeleton className="h-48" />
        ) : data && data.items.length > 0 && groups.length === 0 ? (
          <EmptyState title="No moodboards match your search." />
        ) : data && data.items.length > 0 ? (
          <ul className={cn(cardSurface, 'divide-y divide-hairline overflow-hidden p-0')}>
            {groups.map(({ root, versions }) => {
              const saved =
                versions.find((version) => version.id === shownVersion[root]) ??
                versions.find((version) => version.status === 'CHANGES_REQUESTED') ??
                versions[0];
              const board = patched[saved.id] ?? saved;
              const open = openId === board.id;
              return (
              <li key={board.id} className="px-5 py-4">
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
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-semibold group-hover:text-brand">
                            {board.name}
                          </span>
                          {versions.length > 1 ? <Badge>v{board.version}</Badge> : null}
                          {board.status === 'APPROVED' ? (
                            <Badge tone="brand">Approved by designer</Badge>
                          ) : board.status === 'CHANGES_REQUESTED' ? (
                            <Badge tone="highlight">Changes requested</Badge>
                          ) : null}
                        </span>
                        <span className="mt-1 block text-sm text-muted">
                          {board.savedItems.length}{' '}
                          {board.savedItems.length === 1 ? 'item' : 'items'} ·{' '}
                          {board.version > 1 ? 'Updated' : 'Created'}{' '}
                          {formatDate(board.createdAt)}
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
                    <div className="flex flex-wrap items-center gap-3">
                      {versions.length > 1 ? (
                        <div className="w-44">
                          <Select
                            id={`versions-${root}`}
                            value={board.id}
                            options={versions.map((version) => ({
                              value: version.id,
                              label: `v${version.version} · ${formatDate(version.createdAt)}`,
                            }))}
                            onChange={(id) => {
                              if (id) setShownVersion((current) => ({ ...current, [root]: id }));
                            }}
                          />
                        </div>
                      ) : null}
                      <ButtonLink size="sm" href={`/briefs/new?moodboardId=${board.id}`}>
                        Turn into brief
                      </ButtonLink>
                      <IconButton
                        action="edit"
                        label={`Edit ${board.name}`}
                        onClick={() => setEditBoardId(board.id)}
                      />
                      {board.status !== 'APPROVED' ? (
                        <IconButton
                          action="delete"
                          label={`Delete ${board.name}`}
                          onClick={() => setConfirmBoardId(board.id)}
                        />
                      ) : null}
                    </div>
                  </div>

                  {board.status === 'CHANGES_REQUESTED' && board.reviewNote ? (
                    <p className="mt-3 rounded-lg bg-highlight/15 px-4 py-3 text-sm">
                      <span className="font-semibold">Your designer asked for changes:</span>{' '}
                      {board.reviewNote}
                    </p>
                  ) : board.status === 'APPROVED' ? (
                    <p className="mt-3 text-sm text-muted">
                      A designer is working from this version, so edits are saved as a new
                      version.
                    </p>
                  ) : null}

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
                          <IconButton
                            action="delete"
                            label="Remove image"
                            className="mt-1"
                            onClick={() => void removeItem(board.id, index)}
                          />
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
                    label="Add images"
                    existingHashes={board.savedItems.flatMap((item) =>
                      item.fileHash ? [item.fileHash] : [],
                    )}
                    onUploadedMany={(files) => void addItems(board, files)}
                  />
                  </div>
                  ) : null}
              </li>
              );
            })}
          </ul>
        ) : !error ? (
          <EmptyState
            title="No moodboards yet."
            description="Name one above and start collecting images."
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
