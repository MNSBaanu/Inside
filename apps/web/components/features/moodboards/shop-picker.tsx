'use client';

import { Check, Search, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api/client';
import { buildQuery, useApi } from '@/lib/api/use-api';
import type { Paginated, Product } from '@/lib/types';
import { formatMoney } from '@/lib/utils/format';
import { isOptimizableImage } from '@/lib/utils/images';

export function ShopPicker({
  moodboardId,
  savedSlugs,
  onAdded,
  onClose,
}: {
  moodboardId: string;
  savedSlugs: string[];
  onAdded: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [added, setAdded] = useState<string[]>([]);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { data, error, loading } = useApi<Paginated<Product>>(
    `/products${buildQuery({ q: search, pageSize: 12 })}`,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  async function add(product: Product) {
    setActionError(null);
    setBusySlug(product.slug);
    try {
      await api.post(`/moodboards/${moodboardId}/items`, {
        imageUrl: product.imageUrl,
        note: product.name,
        productSlug: product.slug,
      });
      setAdded((current) => [...current, product.slug]);
      onAdded();
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setBusySlug(null);
    }
  }

  const items = data?.items ?? [];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shop-picker-title"
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-card bg-white p-6 shadow-lift"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close shop"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-sand"
        >
          <X aria-hidden className="h-5 w-5" />
        </button>

        <h2 id="shop-picker-title" className="font-display text-xl font-semibold">
          Add from shop
        </h2>
        <label className="relative mt-4 block">
          <span className="sr-only">Search the shop</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Sofa, lamp, rug"
            autoFocus
            className="w-full rounded-pill border border-hairline bg-surface py-2.5 pl-11 pr-4 text-base outline-none focus:border-brand"
          />
        </label>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {error ? <ErrorNotice message={error} /> : null}
          {actionError ? <ErrorNotice message={actionError} /> : null}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <Skeleton className="h-56" />
              <Skeleton className="h-56" />
              <Skeleton className="h-56" />
            </div>
          ) : items.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-3">
              {items.map((product) => {
                const isAdded =
                  added.includes(product.slug) || savedSlugs.includes(product.slug);
                return (
                  <li key={product.id} className="flex flex-col">
                    <div className="relative aspect-square overflow-hidden rounded-card bg-sand">
                      <Image
                        src={product.imageUrl}
                        unoptimized={!isOptimizableImage(product.imageUrl)}
                        alt={product.name}
                        fill
                        sizes="(min-width: 640px) 15rem, 100vw"
                        className="object-cover"
                      />
                    </div>
                    <p className="mt-2 truncate font-semibold">{product.name}</p>
                    <p className="text-sm text-muted">{formatMoney(product.price)}</p>
                    <Button
                      size="sm"
                      variant={isAdded ? 'outline' : 'primary'}
                      disabled={isAdded || busySlug === product.slug}
                      onClick={() => add(product)}
                      className="mt-2"
                    >
                      {isAdded ? (
                        <>
                          <Check aria-hidden className="h-4 w-4" /> On this board
                        </>
                      ) : busySlug === product.slug ? (
                        'Adding…'
                      ) : (
                        'Add to board'
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : !error ? (
            <p className="py-8 text-center text-muted">No products match that search.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
