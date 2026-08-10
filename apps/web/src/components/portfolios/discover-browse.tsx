'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/layout/empty-state';
import { FilterChips } from '@/components/layout/filter-chips';
import { MasonryGrid } from '@/components/layout/masonry-grid';
import { DiscoverTile } from '@/components/portfolios/discover-tile';
import { fetchMe, formatApiError } from '@/lib/api/auth';
import { listFavourites } from '@/lib/api/favourites';
import { listPortfolios } from '@/lib/api/portfolios';
import type { Portfolio } from '@/lib/api/types';
import { DISCOVER_BANNER } from '@/lib/media';
import { BUDGET_BANDS, ROOM_OPTIONS, STYLE_OPTIONS } from '@/lib/taxonomy';
import { cn } from '@/lib/utils';

const STYLE_LABELS = STYLE_OPTIONS.map((option) => option.label);
const ROOM_LABELS = ROOM_OPTIONS.map((option) => option.label);
const BUDGET_LABELS = BUDGET_BANDS.map((band) => band.label);

export function DiscoverBrowse() {
  const searchParams = useSearchParams();
  const designerId = searchParams.get('designerId') ?? undefined;
  const [items, setItems] = useState<Portfolio[]>([]);
  const [total, setTotal] = useState(0);
  const [style, setStyle] = useState('');
  const [roomType, setRoomType] = useState('');
  const [budgetLabel, setBudgetLabel] = useState('');
  const [savedDesigners, setSavedDesigners] = useState<Set<string>>(new Set());
  const [canSave, setCanSave] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const maxBudget = useMemo(
    () => BUDGET_BANDS.find((band) => band.label === budgetLabel)?.maxBudget,
    [budgetLabel],
  );

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await listPortfolios({
        style: style || undefined,
        roomType: roomType || undefined,
        maxBudget,
        designerId,
        pageSize: 24,
      });
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [style, roomType, maxBudget, designerId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await fetchMe().catch(() => null);
      if (cancelled || me?.activeRole !== 'CLIENT') return;
      setCanSave(true);
      const favourites = await listFavourites().catch(() => null);
      if (cancelled || !favourites) return;
      setSavedDesigners(new Set(favourites.items.map((f) => f.designerId)));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function onSavedChange(id: string, saved: boolean) {
    setSavedDesigners((prev) => {
      const next = new Set(prev);
      if (saved) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const activeFilters = [style, roomType, budgetLabel].filter(Boolean);

  function resetFilters() {
    setStyle('');
    setRoomType('');
    setBudgetLabel('');
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={DISCOVER_BANNER}
          alt=""
          className="h-48 w-full object-cover md:h-72"
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,oklch(0.18_0.03_155_/_0.78)_0%,oklch(0.18_0.03_155_/_0.25)_75%)]" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-9">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
            Client · Discover
          </p>
          <h1 className="mt-2 max-w-xl font-heading text-3xl leading-tight tracking-tight text-white md:text-5xl">
            {designerId ? 'Work by this designer' : 'Browse rooms you love'}
          </h1>
          <p className="mt-3 max-w-lg text-sm text-white/80 md:text-base">
            {designerId
              ? 'Published portfolios from one designer.'
              : 'Pick a style, a room, and a budget — then save the designers behind the work.'}
          </p>
        </div>
      </section>

      <div className="glass-strong sticky top-20 z-20 rounded-2xl p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <FilterChips
            label="Style"
            options={STYLE_LABELS}
            value={style}
            onChange={setStyle}
          />
          <FilterChips
            label="Room"
            options={ROOM_LABELS}
            value={roomType}
            onChange={setRoomType}
          />
          <FilterChips
            label="Budget"
            options={BUDGET_LABELS}
            value={budgetLabel}
            onChange={setBudgetLabel}
          />
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {loading
              ? 'Loading rooms…'
              : `${total} ${total === 1 ? 'room' : 'rooms'}${
                  activeFilters.length ? ` · ${activeFilters.join(' · ')}` : ''
                }`}
          </p>
          {activeFilters.length ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && items.length === 0 ? (
        <EmptyState
          title="No rooms match"
          description="Try a broader style or room, or clear the filters to see everything published."
        />
      ) : null}

      {items.length > 0 ? (
        <MasonryGrid className={cn(loading && 'opacity-60 transition-opacity')}>
          {items.map((portfolio, index) => (
            <DiscoverTile
              key={portfolio.id}
              portfolio={portfolio}
              index={index}
              canSave={canSave}
              saved={savedDesigners.has(portfolio.designerId)}
              onSavedChange={onSavedChange}
              onError={setError}
            />
          ))}
        </MasonryGrid>
      ) : null}
    </div>
  );
}
