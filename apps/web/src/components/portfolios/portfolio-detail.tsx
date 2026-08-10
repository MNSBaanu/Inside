'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { formatApiError, fetchMe } from '@/lib/api/auth';
import { addFavourite, listFavourites, removeFavourite } from '@/lib/api/favourites';
import { getPortfolio } from '@/lib/api/portfolios';
import type { AuthUser, Portfolio } from '@/lib/api/types';
import { cn } from '@/lib/utils';

export function PortfolioDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isFavourite, setIsFavourite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [{ portfolio: data }, me] = await Promise.all([
          getPortfolio(params.id),
          fetchMe().catch(() => null),
        ]);
        if (cancelled) return;
        setPortfolio(data);
        setUser(me);
        if (me?.activeRole === 'CLIENT') {
          const favs = await listFavourites();
          if (!cancelled) {
            setIsFavourite(
              favs.items.some((f) => f.designerId === data.designerId),
            );
          }
        }
      } catch (err) {
        if (!cancelled) setError(formatApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function toggleFavourite() {
    if (!portfolio || !user) return;
    setBusy(true);
    setError(null);
    try {
      if (isFavourite) {
        await removeFavourite(portfolio.designerId);
        setIsFavourite(false);
      } else {
        await addFavourite(portfolio.designerId);
        setIsFavourite(true);
      }
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading portfolio…</p>;
  }

  if (!portfolio) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive" role="alert">
          {error ?? 'Portfolio not found.'}
        </p>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  const canFavourite = user?.activeRole === 'CLIENT';
  const isOwner =
    user?.id === portfolio.designerId && user.activeRole === 'DESIGNER';

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-6">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {portfolio.style} · {portfolio.roomType}
            {!portfolio.isPublished ? ' · Draft' : ''}
          </p>
          <h1 className="font-heading text-4xl tracking-tight md:text-5xl">
            {portfolio.title}
          </h1>
          <p className="text-muted-foreground">
            by {portfolio.designer.name}
            {portfolio.designer.location
              ? ` · ${portfolio.designer.location}`
              : ''}
            {portfolio.budget != null
              ? ` · LKR ${portfolio.budget.toLocaleString()}`
              : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canFavourite ? (
            <Button
              type="button"
              variant={isFavourite ? 'secondary' : 'default'}
              disabled={busy}
              onClick={toggleFavourite}
            >
              {busy
                ? 'Saving…'
                : isFavourite
                  ? 'Remove favourite'
                  : 'Favourite designer'}
            </Button>
          ) : null}
          {isOwner ? (
            <Link
              href={`/designer/portfolios/${portfolio.id}`}
              className={cn(buttonVariants({ variant: 'outline' }))}
            >
              Manage
            </Link>
          ) : null}
          <Link
            href={user?.activeRole === 'DESIGNER' ? '/designer' : '/client'}
            className={cn(buttonVariants({ variant: 'ghost' }))}
          >
            Back
          </Link>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {portfolio.description ? (
        <p className="max-w-2xl text-base leading-relaxed text-foreground/90">
          {portfolio.description}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        {portfolio.images.map((image) => (
          <figure
            key={image.id}
            className="surface-panel overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.imageUrl}
              alt={image.caption ?? portfolio.title}
              className="aspect-[4/3] w-full object-cover"
            />
            {image.caption ? (
              <figcaption className="p-3 text-sm text-muted-foreground">
                {image.caption}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>

      {portfolio.images.length === 0 ? (
        <p className="text-sm text-muted-foreground">No images yet.</p>
      ) : null}
    </div>
  );
}
