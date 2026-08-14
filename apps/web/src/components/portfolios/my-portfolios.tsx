'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/layout/empty-state';
import { InlineAlert } from '@/components/layout/inline-alert';
import { SkeletonList } from '@/components/layout/skeleton';
import { PortfolioCard } from '@/components/portfolios/portfolio-card';
import { formatApiError } from '@/lib/api/auth';
import { deletePortfolio, listMyPortfolios } from '@/lib/api/portfolios';
import type { Portfolio } from '@/lib/api/types';
import { DEMO_LIVING_DETAIL } from '@/lib/media';
import { cn } from '@/lib/utils';

export function MyPortfolios() {
  const [items, setItems] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listMyPortfolios();
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

  async function onDelete(id: string) {
    if (!window.confirm('Delete this portfolio?')) return;
    setBusyId(id);
    setError(null);
    try {
      await deletePortfolio(id);
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusyId(null);
    }
  }

  const publishedCount = items.filter((p) => p.isPublished).length;
  const draftCount = items.length - publishedCount;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={DEMO_LIVING_DETAIL}
          alt=""
          className="h-40 w-full object-cover md:h-56"
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,oklch(0.18_0.03_155_/_0.78)_0%,oklch(0.18_0.03_155_/_0.3)_75%)]" />
        <div className="absolute inset-0 flex flex-col justify-end gap-4 p-6 md:flex-row md:items-end md:justify-between md:p-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
              Designer · Studio
            </p>
            <h1 className="mt-2 font-heading text-3xl tracking-tight text-white md:text-4xl">
              My portfolios
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/80">
              {publishedCount} published · {draftCount} draft
              {draftCount === 1 ? '' : 's'} — publish work so clients can
              discover and match you.
            </p>
          </div>
          <Link
            href="/designer/portfolios/new"
            className={cn(
              buttonVariants(),
              'bg-white text-[oklch(0.24_0.03_155)] hover:bg-white/90',
            )}
          >
            New portfolio
          </Link>
        </div>
      </section>

      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}

      {loading ? <SkeletonList rows={2} /> : null}

      {!loading && items.length === 0 ? (
        <EmptyState
          title="No portfolios yet"
          description="Create your first published piece with style, room, and images."
          actionHref="/designer/portfolios/new"
          actionLabel="New portfolio"
        />
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((portfolio) => (
          <div key={portfolio.id} className="space-y-2">
            <PortfolioCard
              portfolio={portfolio}
              href={`/designer/portfolios/${portfolio.id}`}
            />
            <div className="flex gap-2">
              <Link
                href={`/portfolios/${portfolio.id}`}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'flex-1',
                )}
              >
                Public view
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busyId === portfolio.id}
                onClick={() => onDelete(portfolio.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
