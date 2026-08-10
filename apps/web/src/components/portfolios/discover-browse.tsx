'use client';

import { useEffect, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/layout/empty-state';
import { PortfolioCard } from '@/components/portfolios/portfolio-card';
import { formatApiError } from '@/lib/api/auth';
import { listPortfolios } from '@/lib/api/portfolios';
import type { Portfolio } from '@/lib/api/types';
import { DISCOVER_BANNER } from '@/lib/media';

export function DiscoverBrowse() {
  const searchParams = useSearchParams();
  const designerId = searchParams.get('designerId') ?? undefined;
  const [items, setItems] = useState<Portfolio[]>([]);
  const [total, setTotal] = useState(0);
  const [style, setStyle] = useState('');
  const [roomType, setRoomType] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  async function load(filters?: {
    style?: string;
    roomType?: string;
    maxBudget?: string;
    designerId?: string;
  }) {
    setError(null);
    setLoading(true);
    try {
      const data = await listPortfolios({
        style: filters?.style || undefined,
        roomType: filters?.roomType || undefined,
        maxBudget: filters?.maxBudget
          ? Number(filters.maxBudget)
          : undefined,
        designerId: filters?.designerId,
        pageSize: 24,
      });
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load({ designerId });
  }, [designerId]);

  function onSearch(event: React.FormEvent) {
    event.preventDefault();
    startTransition(() => {
      void load({ style, roomType, maxBudget, designerId });
    });
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={DISCOVER_BANNER}
          alt=""
          className="h-48 w-full object-cover md:h-64"
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,oklch(0.18_0.03_155_/_0.78)_0%,oklch(0.18_0.03_155_/_0.35)_70%)]" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
            Client · Discover
          </p>
          <h1 className="mt-2 font-heading text-3xl tracking-tight text-white md:text-4xl">
            Find the right rooms
          </h1>
          <p className="mt-2 max-w-lg text-sm text-white/80 md:text-base">
            {designerId
              ? 'Browsing published work from one designer.'
              : 'Filter published portfolios by style, room, and budget.'}
          </p>
        </div>
      </section>

      <form
        onSubmit={onSearch}
        className="surface-panel grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="space-y-2">
          <Label htmlFor="style">Style</Label>
          <Input
            id="style"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="Scandinavian"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="roomType">Room</Label>
          <Input
            id="roomType"
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            placeholder="Living Room"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxBudget">Max budget</Label>
          <Input
            id="maxBudget"
            type="number"
            min={0}
            value={maxBudget}
            onChange={(e) => setMaxBudget(e.target.value)}
            placeholder="800000"
          />
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" disabled={pending || loading} className="flex-1">
            {pending || loading ? 'Searching…' : 'Search'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending || loading}
            onClick={() => {
              setStyle('');
              setRoomType('');
              setMaxBudget('');
              startTransition(() => {
                void load({ designerId });
              });
            }}
          >
            Reset
          </Button>
        </div>
      </form>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Loading portfolios…</p>
      ) : null}

      {!loading && items.length === 0 ? (
        <EmptyState
          title="No portfolios match"
          description="Try a broader style or room, or clear filters to see everything published."
          actionHref="/client"
          actionLabel="Clear filters"
        />
      ) : null}

      {items.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{total} results</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((portfolio) => (
              <PortfolioCard
                key={portfolio.id}
                portfolio={portfolio}
                href={`/portfolios/${portfolio.id}`}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
