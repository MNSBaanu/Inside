'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { SaveDesignerButton } from '@/components/favourites/save-designer-button';
import { DesignerRatingBadge } from '@/components/reviews/designer-rating-badge';
import { DesignerReviews } from '@/components/reviews/designer-reviews';
import { BlockUserButton } from '@/components/trust/block-user-button';
import { ReportUserForm } from '@/components/trust/report-user-form';
import { formatApiError, fetchMe } from '@/lib/api/auth';
import { listFavourites } from '@/lib/api/favourites';
import { getPortfolio, listPortfolios } from '@/lib/api/portfolios';
import type { AuthUser, Portfolio } from '@/lib/api/types';
import { cn } from '@/lib/utils';

export function PortfolioDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [related, setRelated] = useState<Portfolio[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isFavourite, setIsFavourite] = useState(false);
  const [loading, setLoading] = useState(true);
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
          const favs = await listFavourites().catch(() => null);
          if (!cancelled && favs) {
            setIsFavourite(
              favs.items.some((f) => f.designerId === data.designerId),
            );
          }
        }

        const byDesigner = await listPortfolios({
          designerId: data.designerId,
          pageSize: 7,
        }).catch(() => null);
        let more = (byDesigner?.items ?? []).filter((p) => p.id !== data.id);
        if (more.length === 0) {
          const byStyle = await listPortfolios({
            style: data.style,
            pageSize: 7,
          }).catch(() => null);
          more = (byStyle?.items ?? []).filter((p) => p.id !== data.id);
        }
        if (!cancelled) setRelated(more.slice(0, 3));
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
  const backHref = user?.activeRole === 'DESIGNER' ? '/designer' : '/client';
  const initials = portfolio.designer.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to discovery
        </Link>
        {isOwner ? (
          <Link
            href={`/designer/portfolios/${portfolio.id}`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            Manage portfolio
          </Link>
        ) : null}
      </div>

      <header className="max-w-3xl space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {portfolio.style} · {portfolio.roomType}
          {!portfolio.isPublished ? ' · Draft' : ''}
        </p>
        <h1 className="font-heading text-4xl leading-tight tracking-tight md:text-5xl">
          {portfolio.title}
        </h1>
        {portfolio.description ? (
          <p className="text-base leading-relaxed text-muted-foreground">
            {portfolio.description}
          </p>
        ) : null}
      </header>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          {portfolio.images.map((image) => (
            <figure key={image.id} className="overflow-hidden rounded-2xl bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.imageUrl}
                alt={image.caption ?? portfolio.title}
                className="w-full object-cover"
              />
              {image.caption ? (
                <figcaption className="bg-card px-4 py-3 text-sm text-muted-foreground">
                  {image.caption}
                </figcaption>
              ) : null}
            </figure>
          ))}
          {portfolio.images.length === 0 ? (
            <p className="text-sm text-muted-foreground">No images yet.</p>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="surface-panel space-y-5 p-5">
            <div className="flex items-center gap-3">
              {portfolio.designer.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={portfolio.designer.avatarUrl}
                  alt=""
                  className="size-12 rounded-full object-cover"
                />
              ) : (
                <span className="grid size-12 place-items-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground">
                  {initials}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-heading text-lg tracking-tight">
                  {portfolio.designer.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {portfolio.designer.location ?? 'Interior designer'}
                  {portfolio.designer.isVerified ? ' · Verified' : ''}
                </p>
                <DesignerRatingBadge
                  designerId={portfolio.designerId}
                  className="mt-1 block text-xs text-muted-foreground"
                />
              </div>
            </div>

            <dl className="space-y-2 border-t border-border/60 pt-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Style</dt>
                <dd>{portfolio.style}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Room</dt>
                <dd>{portfolio.roomType}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Budget</dt>
                <dd>
                  {portfolio.budget != null
                    ? `LKR ${portfolio.budget.toLocaleString()}`
                    : '—'}
                </dd>
              </div>
            </dl>

            <div className="flex flex-col gap-2">
              {canFavourite ? (
                <SaveDesignerButton
                  variant="inline"
                  designerId={portfolio.designerId}
                  designerName={portfolio.designer.name}
                  saved={isFavourite}
                  onSavedChange={setIsFavourite}
                  onError={setError}
                  className="w-full justify-center"
                />
              ) : null}
              <Link
                href={`/client?designerId=${portfolio.designerId}`}
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'w-full justify-center',
                )}
              >
                See all work
              </Link>
              {user && user.id !== portfolio.designerId ? (
                <div className="space-y-3 border-t border-border/60 pt-4">
                  <BlockUserButton
                    userId={portfolio.designerId}
                    userName={portfolio.designer.name}
                  />
                  <ReportUserForm
                    targetType="USER"
                    targetId={portfolio.designerId}
                    reportedUserId={portfolio.designerId}
                    targetLabel={portfolio.designer.name}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>

      <DesignerReviews designerId={portfolio.designerId} />

      {related.length > 0 ? (
        <section className="space-y-4 border-t border-border/60 pt-8">
          <h2 className="font-heading text-2xl tracking-tight">
            More like this
          </h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/portfolios/${item.id}`}
                className="glass group overflow-hidden rounded-2xl"
              >
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  {item.images[0]?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.images[0].imageUrl}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                    />
                  ) : null}
                </div>
                <div className="space-y-1 p-4">
                  <p className="font-heading text-base tracking-tight">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.style} · {item.roomType}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
