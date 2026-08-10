'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/layout/empty-state';
import { formatApiError } from '@/lib/api/auth';
import { listFavourites, removeFavourite } from '@/lib/api/favourites';
import type { Favourite } from '@/lib/api/types';
import { DEMO_INSPO_1 } from '@/lib/media';
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
      <section className="relative overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={DEMO_INSPO_1}
          alt=""
          className="h-40 w-full object-cover md:h-52"
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,oklch(0.18_0.03_155_/_0.75)_0%,oklch(0.18_0.03_155_/_0.3)_75%)]" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
            Client · Saved
          </p>
          <h1 className="mt-2 font-heading text-3xl tracking-tight text-white md:text-4xl">
            Favourites
          </h1>
          <p className="mt-2 max-w-lg text-sm text-white/80">
            Designers you saved while browsing discovery.
          </p>
        </div>
      </section>

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
              <div className="flex items-center gap-3">
                {fav.designer.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fav.designer.avatarUrl}
                    alt=""
                    className="size-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground">
                    {fav.designer.name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-heading text-xl tracking-tight">
                    {fav.designer.name}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {fav.designer.location ?? 'Location not set'}
                    {fav.designer.isVerified ? ' · Verified' : ''}
                    {fav.designer.isAvailable ? '' : ' · Unavailable'}
                  </p>
                </div>
              </div>
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
