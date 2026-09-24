'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { Favourite } from '@/lib/types';

export function FavouriteButton({ designerId }: { designerId: string }) {
  const { user, status } = useSession();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  const isClient = status === 'authenticated' && user?.activeRole === 'CLIENT';

  useEffect(() => {
    if (!isClient) return;
    let active = true;
    api
      .get<{ items: Favourite[] }>('/favourites')
      .then((data) => {
        if (active)
          setSaved(data.items.some((item) => item.designerId === designerId));
      })
      .catch(() => {
        // A failed lookup just leaves the button in its unsaved state.
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [designerId, isClient]);

  if (!isClient) return null;

  async function toggle() {
    setBusy(true);
    try {
      if (saved) {
        await api.delete(`/favourites/${designerId}`);
        setSaved(false);
      } else {
        await api.post('/favourites', { designerId });
        setSaved(true);
      }
    } catch {
      // Keep the current state; the next page load corrects it.
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={toggle}
      disabled={busy || !ready}
      aria-pressed={saved}
    >
      {saved ? 'Saved' : 'Save designer'}
    </Button>
  );
}
