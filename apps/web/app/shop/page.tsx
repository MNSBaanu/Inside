'use client';

import { useEffect } from 'react';
import { ProductCard } from '@/components/features/shop/product-card';
import { Pagination } from '@/components/ui/pagination';
import { Combobox } from '@/components/ui/combobox';
import { BareInput } from '@/components/ui/field';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { FilterBar, FilterField } from '@/components/ui/filter-bar';
import { PageHeader } from '@/components/ui/page-header';
import { PRODUCT_CATEGORIES, STYLES } from '@/lib/utils/options';
import { usePagedSearch } from '@/lib/api/use-paged-search';
import type { Product } from '@/lib/types';

const PAGE_SIZE = 12;

const EMPTY_FILTERS = { q: '', category: '', style: '', maxPrice: '' };

export default function ShopPage() {
  const {
    data,
    error,
    loading,
    filters,
    setFilters,
    page,
    showPage,
    totalPages,
    resultsRef,
  } = usePagedSearch<Product, typeof EMPTY_FILTERS>('/products', EMPTY_FILTERS, PAGE_SIZE);

  useEffect(() => {
    const style = new URLSearchParams(window.location.search).get('style');
    if (style) setFilters((current) => ({ ...current, style }));
  }, []);

  return (
    <div className="shell page">
      <PageHeader
        eyebrow="Shop"
        title="Pieces to finish the room."
        description="Furniture, lighting, rugs and decor chosen to go with your space. Save favourites to a moodboard."
      />

      <FilterBar onSubmit={(event) => event.preventDefault()} className="mt-8">
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

      <div ref={resultsRef} className="mt-8 scroll-mt-28">
        {error ? <ErrorNotice message={error} /> : null}

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[4/5] rounded-card" />
            ))}
          </div>
        ) : data && data.items.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {data.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={showPage} />
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
