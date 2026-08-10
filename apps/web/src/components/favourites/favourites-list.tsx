'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { formatApiError } from '@/lib/api/auth';
import { listFavourites, removeFavourite } from '@/lib/api/favourites';
import type { Favourite } from '@/lib/api/types';
import { cn } from '@/lib/utils';

export function FavouritesList() {
  const [items, setItems] = useState<Favourite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listFavourites();
      setItems(data.items);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onRemove(designerId: string) {
    setBusyId(designerId);
    setError(null);
    try {
      await removeFavourite(designerId);
      setItems((prev) => prev.filter((f) => f.designerId !== designerId));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-3xl tracking-tight">Favourites</h1>
        <p className="text-muted-foreground">
          Designers you saved from discovery.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading favourites…</p>
      ) : null}

      {!loading && items.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">No favourites yet.</p>
          <Link href="/client" className={cn(buttonVariants())}>
            Browse portfolios
          </Link>
        </div>
      ) : null}

      <ul className="space-y-3">
        {items.map((fav) => (
          <li
            key={fav.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/60 p-4"
          >
            <div>
              <p className="font-medium">{fav.designer.name}</p>
              <p className="text-sm text-muted-foreground">
                {fav.designer.location ?? 'Location not set'}
                {fav.designer.isVerified ? ' · Verified' : ''}
                {fav.designer.isAvailable ? '' : ' · Unavailable'}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/client?designerId=${fav.designerId}`}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                View work
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busyId === fav.designerId}
                onClick={() => onRemove(fav.designerId)}
              >
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
