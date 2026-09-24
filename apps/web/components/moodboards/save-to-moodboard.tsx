'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { api, errorMessage } from '@/lib/api';
import type { Moodboard } from '@/lib/types';

/**
 * Saves a portfolio's cover to one of the client's moodboards. The link to
 * the portfolio lets a brief generated from the board pick up its style and
 * room type.
 */
export function SaveToMoodboard({
  portfolioId,
  imageUrl,
  title,
}: {
  portfolioId: string;
  imageUrl: string;
  title: string;
}) {
  const { user, status } = useSession();
  const isClient = status === 'authenticated' && user?.activeRole === 'CLIENT';

  const [boards, setBoards] = useState<Moodboard[] | null>(null);
  const [boardId, setBoardId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isClient) return;
    let active = true;
    api
      .get<{ items: Moodboard[] }>('/moodboards')
      .then((data) => {
        if (!active) return;
        setBoards(data.items);
        setBoardId(data.items[0]?.id ?? '');
      })
      .catch((cause: unknown) => {
        if (active) setError(errorMessage(cause));
      });
    return () => {
      active = false;
    };
  }, [isClient]);

  if (!isClient) return null;
  if (boards === null) {
    return error ? <p className="mt-4 text-sm text-error">{error}</p> : null;
  }

  if (boards.length === 0) {
    return (
      <p className="mt-4 text-sm text-muted">
        <Link href="/moodboards" className="link-underline">
          Create a moodboard
        </Link>{' '}
        to save this project for later.
      </p>
    );
  }

  const board = boards.find((item) => item.id === boardId);
  const alreadySaved = board?.savedItems.some(
    (item) => item.portfolioId === portfolioId,
  );

  async function save() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const data = await api.post<{ moodboard: Moodboard }>(
        `/moodboards/${boardId}/items`,
        { imageUrl, portfolioId, note: title },
      );
      setBoards(
        (current) =>
          current?.map((item) =>
            item.id === data.moodboard.id ? data.moodboard : item,
          ) ?? null,
      );
      setMessage(`Saved to ${data.moodboard.name}.`);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 border-t border-hairline pt-6">
      <p className="label text-ink/70">Save to moodboard</p>
      <div className="mt-3 flex flex-col gap-3">
        {boards.length > 1 ? (
          <label htmlFor="save-to-moodboard" className="sr-only">
            Moodboard
          </label>
        ) : null}
        {boards.length > 1 ? (
          <Select
            id="save-to-moodboard"
            value={boardId}
            options={boards.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            onChange={(value) => {
              setBoardId(value);
              setMessage(null);
            }}
          />
        ) : null}
        <Button
          variant="outline"
          fullWidth
          disabled={busy || alreadySaved}
          onClick={() => void save()}
        >
          {alreadySaved ? `Saved to ${board?.name}` : `Save to ${board?.name}`}
        </Button>
      </div>
      {message ? (
        <p role="status" className="mt-3 text-sm text-muted">
          {message}
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
    </div>
  );
}
