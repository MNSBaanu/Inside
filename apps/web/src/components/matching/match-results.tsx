'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { formatApiError } from '@/lib/api/auth';
import { getBrief } from '@/lib/api/briefs';
import { matchDesigners } from '@/lib/api/matching';
import type { Brief, MatchResult } from '@/lib/api/types';
import { cn } from '@/lib/utils';

export function MatchResults() {
  const params = useParams<{ id: string }>();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [items, setItems] = useState<MatchResult[]>([]);
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

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Matching"
        title="Designer fit"
        description={
          brief
            ? `Ranked for ${brief.styles.join(', ')} · ${brief.rooms.join(', ')}`
            : 'Fit scores for this brief'
        }
        actions={
          <>
            <Link
              href={`/client/briefs/${params.id}`}
              className={cn(buttonVariants({ variant: 'outline' }))}
            >
              Edit brief
            </Link>
            <Link
              href="/client/briefs"
              className={cn(buttonVariants({ variant: 'ghost' }))}
            >
              All briefs
            </Link>
          </>
        }
      />

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

      <ul className="space-y-4">
        {items.map((item, index) => (
          <li key={item.designer.id} className="surface-panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Rank {index + 1}
                </p>
                <p className="font-heading text-2xl tracking-tight">
                  {item.designer.name}
                  {item.designer.isVerified ? (
                    <span className="ml-2 text-sm font-sans text-muted-foreground">
                      Verified
                    </span>
                  ) : null}
                </p>
                <p className="text-sm text-muted-foreground">
                  {item.designer.location ?? 'Location not set'}
                  {item.designer.isAvailable ? '' : ' · Unavailable'}
                </p>
                {item.designer.bio ? (
                  <p className="max-w-2xl text-sm leading-relaxed text-foreground/90">
                    {item.designer.bio}
                  </p>
                ) : null}
              </div>
              <div className="rounded-2xl bg-secondary px-4 py-3 text-right">
                <p className="font-heading text-3xl tabular-nums">{item.score}</p>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  fit score
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Style {item.breakdown.style} · Room {item.breakdown.room} · Budget{' '}
              {item.breakdown.budget}
            </p>
            {item.matchedPortfolios.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {item.matchedPortfolios.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/portfolios/${p.id}`}
                      className="rounded-full bg-muted px-3 py-1 text-sm text-foreground/90 transition hover:bg-secondary"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-5">
              <Link
                href={`/client?designerId=${item.designer.id}`}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                View portfolios
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
