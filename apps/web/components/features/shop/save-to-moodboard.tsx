'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { Button, ButtonLink } from '@/components/ui/button';
import { ErrorNotice } from '@/components/ui/feedback';
import { Field, Input } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { api, errorMessage } from '@/lib/api/client';
import { useApi } from '@/lib/api/use-api';
import { cn } from '@/lib/utils/cn';
import type { Moodboard, Product } from '@/lib/types';

export function SaveToMoodboard({ product }: { product: Product }) {
  const { user } = useSession();

  if (!user) {
    return (
      <ButtonLink href={`/login?next=/shop/${product.slug}`}>
        Sign in to save to a moodboard
      </ButtonLink>
    );
  }

  if (user.role === 'ADMIN' || user.activeRole !== 'CLIENT') return null;

  return <SaveForm product={product} />;
}

const NEW_BOARD = 'new';

function latestVersions(boards: Moodboard[]) {
  const latest = new Map<string, Moodboard>();
  for (const board of boards) {
    const root = board.parentId ?? board.id;
    const current = latest.get(root);
    if (!current || board.version > current.version) latest.set(root, board);
  }
  return [...latest.values()].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

function SaveForm({ product }: { product: Product }) {
  const { data, loading, reload } = useApi<{ items: Moodboard[] }>('/moodboards');
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [savedTo, setSavedTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const boards = latestVersions(data?.items ?? []);
  const creating = choice === NEW_BOARD;
  const close = useCallback(() => {
    if (!busy) setOpen(false);
  }, [busy]);

  function start() {
    setError(null);
    setChoice(boards[0]?.id ?? NEW_BOARD);
    setName(boards.length === 0 && product.style ? `${product.style} ideas` : '');
    setOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const item = {
      imageUrl: product.imageUrl,
      note: product.name,
      productSlug: product.slug,
    };
    setBusy(true);
    try {
      if (creating) {
        await api.post('/moodboards', { name: name.trim(), savedItems: [item] });
        setSavedTo(name.trim());
        await reload();
      } else {
        await api.post(`/moodboards/${choice}/items`, item);
        setSavedTo(boards.find((board) => board.id === choice)?.name ?? 'your moodboard');
      }
      setOpen(false);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Button onClick={start}>Save to moodboard</Button>
      </div>
      {savedTo ? (
        <p role="status" className="text-sm text-muted">
          Saved to {savedTo}.{' '}
          <Link href="/moodboards" className="link-underline">
            View moodboards
          </Link>
        </p>
      ) : null}

      {open ? (
        <Modal
          title="Save to a moodboard"
          description={product.name}
          onClose={close}
        >
          <form onSubmit={save} className="flex flex-col gap-4">
            {error ? <ErrorNotice message={error} /> : null}

            {boards.length > 0 ? (
              <fieldset className="flex flex-col gap-2">
                <legend className="ui-label mb-1 text-ink/70">
                  Choose a moodboard
                </legend>
                {[
                  ...boards.map((board) => ({
                    value: board.id,
                    label: board.name,
                    detail: `${board.savedItems.length} item${board.savedItems.length === 1 ? '' : 's'}`,
                  })),
                  { value: NEW_BOARD, label: 'New moodboard', detail: '' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-card border px-4 py-3 transition-colors duration-300',
                      choice === option.value
                        ? 'border-brand bg-brand-soft'
                        : 'border-hairline hover:border-ink/30',
                    )}
                  >
                    <input
                      type="radio"
                      name="moodboard"
                      value={option.value}
                      checked={choice === option.value}
                      onChange={() => setChoice(option.value)}
                      className="h-4 w-4 accent-brand"
                    />
                    <span className="font-semibold">{option.label}</span>
                    {option.detail ? (
                      <span className="ml-auto text-sm text-muted">{option.detail}</span>
                    ) : null}
                  </label>
                ))}
              </fieldset>
            ) : (
              <p className="text-sm text-muted">
                You don&apos;t have a moodboard yet. Name one and this product
                will be its first item.
              </p>
            )}

            {creating ? (
              <Field label="Moodboard name" htmlFor="new-moodboard-name">
                <Input
                  id="new-moodboard-name"
                  required
                  minLength={2}
                  maxLength={120}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Bedroom calm"
                  autoFocus
                />
              </Field>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={close} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy || (creating && name.trim().length < 2)}>
                {busy ? 'Saving…' : creating ? 'Create and save' : 'Save'}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
