'use client';

import { useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { ErrorNotice } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import type { Favourite } from '@/lib/types';

export function FavouriteButton({ designerId }: { designerId: string }) {
  const { user, status } = useSession();
  if (status !== 'authenticated' || user?.activeRole !== 'CLIENT') return null;
  return (
    <ClientFavouriteButton
      key={`${user.id}:${designerId}`}
      designerId={designerId}
    />
  );
}

function ClientFavouriteButton({ designerId }: { designerId: string }) {
  const { data, error, loading, reload } = useApi<{ items: Favourite[] }>(
    '/favourites',
  );
  const [savedOverride, setSaved] = useState<boolean | null>(null);
  const saved =
    savedOverride ??
    data?.items.some((item) => item.designerId === designerId) ??
    false;
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setActionError(null);
    try {
      if (saved) {
        await api.delete(`/favourites/${designerId}`);
        setSaved(false);
      } else {
        await api.post('/favourites', { designerId });
        setSaved(true);
      }
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {error || actionError ? (
        <ErrorNotice message={error ?? actionError!} />
      ) : null}
      {error ? (
        <Button variant="outline" onClick={() => void reload()}>
          Retry saved designers
        </Button>
      ) : (
        <Button
          variant="outline"
          size="lg"
          onClick={toggle}
          disabled={busy || loading || !data}
          aria-pressed={saved}
        >
          {saved ? 'Saved' : 'Save designer'}
        </Button>
      )}
    </div>
  );
}
