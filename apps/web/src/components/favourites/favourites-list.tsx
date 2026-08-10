'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Client · Saved"
        title="Favourites"
        description="Designers you saved while browsing discovery."
      />

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading favourites…</p>
      ) : null}

      {!loading && items.length === 0 ? (
        <EmptyState
          title="No favourites yet"
          description="Open a portfolio and favourite the designer to keep them here."
          actionHref="/client"
          actionLabel="Browse portfolios"
        />
      ) : null}

      <ul className="grid gap-4 md:grid-cols-2">
        {items.map((fav) => (
          <li key={fav.id} className="surface-panel flex flex-col gap-4 p-5">
            <div>
              <p className="font-heading text-xl tracking-tight">
                {fav.designer.name}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {fav.designer.location ?? 'Location not set'}
                {fav.designer.isVerified ? ' · Verified' : ''}
                {fav.designer.isAvailable ? '' : ' · Unavailable'}
              </p>
              {fav.designer.bio ? (
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground/85">
                  {fav.designer.bio}
                </p>
              ) : null}
            </div>
            <div className="mt-auto flex gap-2">
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
