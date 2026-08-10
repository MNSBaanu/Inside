'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { PortfolioCard } from '@/components/portfolios/portfolio-card';
import { formatApiError } from '@/lib/api/auth';
import { deletePortfolio, listMyPortfolios } from '@/lib/api/portfolios';
import type { Portfolio } from '@/lib/api/types';
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

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Designer · Studio"
        title="My portfolios"
        description="Publish work so clients can discover and match you."
        actions={
          <Link href="/designer/portfolios/new" className={cn(buttonVariants())}>
            New portfolio
          </Link>
        }
      />

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}

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
