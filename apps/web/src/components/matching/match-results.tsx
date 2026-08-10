'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/layout/empty-state';
import { SaveDesignerButton } from '@/components/favourites/save-designer-button';
import { formatApiError } from '@/lib/api/auth';
import { getBrief } from '@/lib/api/briefs';
import { listFavourites } from '@/lib/api/favourites';
import { matchDesigners } from '@/lib/api/matching';
import { listPortfolios } from '@/lib/api/portfolios';
import type { Brief, MatchResult, Portfolio } from '@/lib/api/types';
import { DEMO_LIVING_DETAIL } from '@/lib/media';
import { cn } from '@/lib/utils';

function initialsOf(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function MatchResults() {
  const params = useParams<{ id: string }>();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [items, setItems] = useState<MatchResult[]>([]);
  const [coversByDesigner, setCoversByDesigner] = useState<
    Record<string, Portfolio[]>
  >({});
  const [savedDesigners, setSavedDesigners] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [briefData, matchData] = await Promise.all([
          getBrief(params.id),
          matchDesigners(params.id),
        ]);
        if (cancelled) return;
        setBrief(briefData.brief);
        setItems(matchData.items);

        const [published, favourites] = await Promise.all([
          listPortfolios({ pageSize: 60 }).catch(() => null),
          listFavourites().catch(() => null),
        ]);
        if (cancelled) return;
        if (published) {
          const grouped: Record<string, Portfolio[]> = {};
          published.items.forEach((portfolio) => {
            grouped[portfolio.designerId] ??= [];
            grouped[portfolio.designerId].push(portfolio);
          });
          setCoversByDesigner(grouped);
        }
        if (favourites) {
          setSavedDesigners(new Set(favourites.items.map((f) => f.designerId)));
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

  function onSavedChange(designerId: string, saved: boolean) {
    setSavedDesigners((prev) => {
      const next = new Set(prev);
      if (saved) next.add(designerId);
      else next.delete(designerId);
      return next;
    });
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={DEMO_LIVING_DETAIL}
          alt=""
          className="h-40 w-full object-cover md:h-56"
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,oklch(0.18_0.03_155_/_0.8)_0%,oklch(0.18_0.03_155_/_0.3)_78%)]" />
        <div className="absolute inset-0 flex flex-col justify-end gap-4 p-6 md:flex-row md:items-end md:justify-between md:p-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
              Client · Matching
            </p>
            <h1 className="mt-2 font-heading text-3xl tracking-tight text-white md:text-4xl">
              Designer fit
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/80">
              {brief
                ? `Ranked for ${brief.styles.join(', ')} · ${brief.rooms.join(', ')}`
                : 'Fit scores for this brief'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/client/briefs/${params.id}`}
              className={cn(
                buttonVariants(),
                'bg-white text-[oklch(0.24_0.03_155)] hover:bg-white/90',
              )}
            >
              Edit brief
            </Link>
            <Link
              href="/client/briefs"
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'text-white hover:bg-white/10 hover:text-white',
              )}
            >
              All briefs
            </Link>
          </div>
        </div>
      </section>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Matching designers…</p>
      ) : null}

      {!loading && items.length === 0 ? (
        <EmptyState
          title="No strong matches"
          description="Try broader styles or rooms on the brief, then match again."
          actionHref={`/client/briefs/${params.id}`}
          actionLabel="Edit brief"
        />
      ) : null}

      <ul className="space-y-5">
        {items.map((item, index) => {
          const designerPortfolios = coversByDesigner[item.designer.id] ?? [];
          const matchedIds = new Set(item.matchedPortfolios.map((p) => p.id));
          const showcase = [
            ...designerPortfolios.filter((p) => matchedIds.has(p.id)),
            ...designerPortfolios.filter((p) => !matchedIds.has(p.id)),
          ].slice(0, 3);

          return (
            <li key={item.designer.id} className="surface-panel overflow-hidden">
              <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-4 p-5">
                  <div className="flex items-start gap-4">
                    {item.designer.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.designer.avatarUrl}
                        alt=""
                        className="size-14 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="grid size-14 shrink-0 place-items-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground">
                        {initialsOf(item.designer.name)}
                      </span>
                    )}
                    <div className="min-w-0 space-y-1">
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        Rank {index + 1}
                      </p>
                      <p className="font-heading text-2xl leading-tight tracking-tight">
                        {item.designer.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.designer.location ?? 'Location not set'}
                        {item.designer.isVerified ? ' · Verified' : ''}
                        {item.designer.isAvailable ? '' : ' · Unavailable'}
                      </p>
                    </div>
                  </div>

                  {item.designer.bio ? (
                    <p className="line-clamp-2 max-w-xl text-sm leading-relaxed text-foreground/90">
                      {item.designer.bio}
                    </p>
                  ) : null}

                  <dl className="grid max-w-md grid-cols-3 gap-3">
                    {(
                      [
                        ['Style', item.breakdown.style],
                        ['Room', item.breakdown.room],
                        ['Budget', item.breakdown.budget],
                      ] as const
                    ).map(([label, value]) => (
                      <div key={label} className="space-y-1.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <dt className="text-xs text-muted-foreground">
                            {label}
                          </dt>
                          <dd className="text-xs font-medium tabular-nums">
                            {value}
                          </dd>
                        </div>
                        <div className="h-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary/70"
                            style={{
                              width: `${Math.min(Math.max(value, 0), 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </dl>

                  <div className="flex flex-wrap items-center gap-2">
                    <SaveDesignerButton
                      variant="inline"
                      designerId={item.designer.id}
                      designerName={item.designer.name}
                      saved={savedDesigners.has(item.designer.id)}
                      onSavedChange={(saved) =>
                        onSavedChange(item.designer.id, saved)
                      }
                      onError={setError}
                    />
                    <Link
                      href={`/client/requests/new?designerId=${item.designer.id}&briefId=${params.id}`}
                      className={cn(buttonVariants())}
                    >
                      Invite designer
                    </Link>
                    <Link
                      href={`/client?designerId=${item.designer.id}`}
                      className={cn(buttonVariants({ variant: 'outline' }))}
                    >
                      View portfolios
                    </Link>
                  </div>
                </div>

                <div className="space-y-3 border-t border-border/60 bg-muted/30 p-5 md:border-l md:border-t-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Fit score
                    </p>
                    <p className="font-heading text-3xl tabular-nums">
                      {item.score}
                    </p>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{
                        width: `${Math.min(Math.max(item.score, 0), 100)}%`,
                      }}
                    />
                  </div>

                  {showcase.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {showcase.map((portfolio) => (
                        <Link
                          key={portfolio.id}
                          href={`/portfolios/${portfolio.id}`}
                          title={portfolio.title}
                          className="group overflow-hidden rounded-lg border border-border/60 bg-card"
                        >
                          <div className="aspect-square overflow-hidden bg-muted">
                            {portfolio.images[0]?.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={portfolio.images[0].imageUrl}
                                alt={portfolio.title}
                                loading="lazy"
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              />
                            ) : null}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No published work yet.
                    </p>
                  )}

                  {item.matchedPortfolios.length > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Matched on{' '}
                      {item.matchedPortfolios.map((p) => p.title).join(', ')}
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
