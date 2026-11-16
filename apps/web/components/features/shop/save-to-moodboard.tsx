'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { Button, ButtonLink } from '@/components/ui/button';
import { ErrorNotice } from '@/components/ui/feedback';
import { Select } from '@/components/ui/select';
import { api, errorMessage } from '@/lib/api/client';
import { useApi } from '@/lib/api/use-api';
import type { Moodboard, Product } from '@/lib/types';

export function SaveToMoodboard({ product }: { product: Product }) {
  const { user } = useSession();

  if (!user) {
    return (
      <ButtonLink href={`/login?next=/shop/${product.slug}`} variant="outline">
        Sign in to save to a moodboard
      </ButtonLink>
    );
  }

  return <SaveForm product={product} />;
}

function SaveForm({ product }: { product: Product }) {
  const { data, loading } = useApi<{ items: Moodboard[] }>('/moodboards');
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const boards = data?.items ?? [];
  const moodboardId = selected || boards[0]?.id || '';

  async function save() {
    setError(null);
    setBusy(true);
    try {
      await api.post(`/moodboards/${moodboardId}/items`, {
        imageUrl: product.imageUrl,
        note: product.name,
      });
      setSaved(true);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;

  if (boards.length === 0) {
    return (
      <p className="text-sm text-muted">
        You do not have a moodboard yet.{' '}
        <Link href="/moodboards" className="link-underline">
          Create one
        </Link>{' '}
        to save products and ideas.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <ErrorNotice message={error} /> : null}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-56">
          <Select
            id="moodboard"
            value={moodboardId}
            options={boards.map((board) => ({
              value: board.id,
              label: board.name,
            }))}
            onChange={(value) => {
              setSelected(value);
              setSaved(false);
            }}
          />
        </div>
        <Button variant="outline" onClick={save} disabled={busy || saved}>
          {saved ? 'Saved' : busy ? 'Saving…' : 'Save to moodboard'}
        </Button>
      </div>
      {saved ? (
        <p role="status" className="text-sm text-muted">
          Added to your moodboard.{' '}
          <Link href="/moodboards" className="link-underline">
            View moodboards
          </Link>
        </p>
      ) : null}
    </div>
  );
}
