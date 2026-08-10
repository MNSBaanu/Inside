'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PortfolioCard } from '@/components/portfolios/portfolio-card';
import { formatApiError } from '@/lib/api/auth';
import { listPortfolios } from '@/lib/api/portfolios';
import type { Portfolio } from '@/lib/api/types';

export function DiscoverBrowse() {
  const router = useRouter();
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
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-3xl tracking-tight">Discover</h1>
        <p className="text-muted-foreground">
          Browse published portfolios by style, room, and budget.
          {designerId ? ' Filtered to one designer.' : ''}
        </p>
      </div>

      <form
        onSubmit={onSearch}
        className="grid gap-3 rounded-xl border border-border bg-card/60 p-4 sm:grid-cols-2 lg:grid-cols-4"
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
          <Button type="submit" disabled={pending || loading} className="w-full">
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
        <p className="text-sm text-muted-foreground">No portfolios match.</p>
      ) : null}

      {items.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">{total} results</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((portfolio) => (
              <PortfolioCard
                key={portfolio.id}
                portfolio={portfolio}
                href={`/portfolios/${portfolio.id}`}
              />
            ))}
          </div>
        </>
      ) : null}

      <Button type="button" variant="ghost" onClick={() => router.refresh()}>
        Refresh
      </Button>
    </div>
  );
}
