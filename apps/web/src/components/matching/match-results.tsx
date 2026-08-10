'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl tracking-tight">Matches</h1>
          <p className="text-muted-foreground">
            {brief
              ? `Ranked designers for ${brief.styles.join(', ')} · ${brief.rooms.join(', ')}`
              : 'Designer fit scores for this brief'}
          </p>
        </div>
        <div className="flex gap-2">
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
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Matching designers…</p>
      ) : null}

      {!loading && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No strong matches yet. Try broader styles or rooms.
        </p>
      ) : null}

      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item.designer.id}
            className="rounded-xl border border-border bg-card/60 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {item.designer.name}
                  {item.designer.isVerified ? ' · Verified' : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  {item.designer.location ?? 'Location not set'}
                  {item.designer.isAvailable ? '' : ' · Unavailable'}
                </p>
                {item.designer.bio ? (
                  <p className="mt-2 max-w-2xl text-sm text-foreground/90">
                    {item.designer.bio}
                  </p>
                ) : null}
              </div>
              <div className="text-right">
                <p className="font-heading text-2xl tabular-nums">{item.score}</p>
                <p className="text-xs text-muted-foreground">fit score</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Style {item.breakdown.style} · Room {item.breakdown.room} · Budget{' '}
              {item.breakdown.budget}
            </p>
            {item.matchedPortfolios.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {item.matchedPortfolios.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/portfolios/${p.id}`}
                      className="text-sm text-primary underline-offset-4 hover:underline"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-4">
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
