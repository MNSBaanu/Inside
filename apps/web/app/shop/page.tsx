'use client';

import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/features/shop/product-card';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { BareInput } from '@/components/ui/field';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { FilterBar, FilterField } from '@/components/ui/filter-bar';
import { PageHeader } from '@/components/ui/page-header';
import { PRODUCT_CATEGORIES, STYLES } from '@/lib/utils/options';
import { buildQuery, useApi } from '@/lib/api/use-api';
import type { Paginated, Product } from '@/lib/types';

const PAGE_SIZE = 12;

const EMPTY_FILTERS = { q: '', category: '', style: '', maxPrice: '' };

export default function ShopPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const query = buildQuery({
    q: applied.q,
    category: applied.category,
    style: applied.style,
    maxPrice: applied.maxPrice,
    page,
    pageSize: PAGE_SIZE,
  });

  const { data, error, loading } = useApi<Paginated<Product>>(
    `/products${query}`,
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setApplied(filters);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="shell py-32 md:py-40">
      <PageHeader
        eyebrow="Shop"
        title="Pieces to finish the room."
        description="Furniture, lighting, rugs and decor chosen to go with your space. Save favourites to a moodboard."
      />

      <FilterBar onSubmit={(event) => event.preventDefault()} className="mt-12">
        <FilterField label="Search" htmlFor="q">
          <BareInput
            id="q"
            type="search"
            value={filters.q}
            onChange={(event) =>
              setFilters({ ...filters, q: event.target.value })
            }
            placeholder="Sofa, lamp, rug"
            autoComplete="off"
          />
        </FilterField>
        <FilterField label="Category" htmlFor="category">
          <Combobox
            bare
            id="category"
            value={filters.category}
            options={PRODUCT_CATEGORIES}
            onChange={(category) => setFilters({ ...filters, category })}
            placeholder="Any category"
          />
        </FilterField>
        <FilterField label="Style" htmlFor="style">
          <Combobox
            bare
            id="style"
            value={filters.style}
            options={STYLES}
            onChange={(style) => setFilters({ ...filters, style })}
            placeholder="Any style"
          />
        </FilterField>
        <FilterField label="Price up to" htmlFor="maxPrice">
          <BareInput
            id="maxPrice"
            type="number"
            min={0}
            value={filters.maxPrice}
            onChange={(event) =>
              setFilters({ ...filters, maxPrice: event.target.value })
            }
            placeholder="Any price"
            autoComplete="off"
          />
        </FilterField>
      </FilterBar>

      <div className="mt-12">
        {error ? <ErrorNotice message={error} /> : null}

        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square" />
            ))}
          </div>
        ) : data && data.items.length > 0 ? (
          <>
            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {data.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="mt-16 flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Previous
                </Button>
                <span className="label text-muted">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </>
        ) : !error ? (
          <EmptyState
            title="No products match those filters."
            description="Try a different category or a higher price, or clear the filters."
          />
        ) : null}
      </div>
    </div>
  );
}
