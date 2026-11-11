'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { DesignerCard } from '@/components/features/designers/designer-card';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Combobox } from '@/components/ui/combobox';
import { BareInput } from '@/components/ui/field';
import { FilterBar, FilterField } from '@/components/ui/filter-bar';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { Select } from '@/components/ui/select';
import { single } from '@/lib/utils/url';
import { LOCATIONS, STYLES } from '@/lib/utils/options';
import { buildQuery, useApi } from '@/lib/api/use-api';
import type { DesignerSummary, Paginated } from '@/lib/types';

const PAGE_SIZE = 12;
type SearchParams = Record<string, string | string[] | undefined>;
type Filters = {
  q: string;
  location: string;
  style: string;
  verifiedOnly: string;
  availableOnly: string;
};

function directoryUrl(filters: Filters, page = 1) {
  return `/explore${buildQuery({
    tab: 'designers',
    ...filters,
    q: filters.q.trim(),
    location: filters.location.trim(),
    page: page > 1 ? page : undefined,
  })}`;
}

export function DesignersExplorer({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const router = useRouter();
  const resultsRef = useRef<HTMLElement>(null);
  const showPage = (next: number) => {
    router.push(directoryUrl(filters, next), { scroll: false });
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const filters: Filters = {
    q: single(searchParams.q),
    location: single(searchParams.location),
    style: single(searchParams.style),
    verifiedOnly: single(searchParams.verifiedOnly) === 'true' ? 'true' : '',
    availableOnly: single(searchParams.availableOnly) === 'true' ? 'true' : '',
  };
  const requestedPage = Number(single(searchParams.page));
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;
  const query = buildQuery({ ...filters, page, pageSize: PAGE_SIZE });
  const { data, error, loading } = useApi<Paginated<DesignerSummary>>(
    `/designers${query}`,
  );
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const activeFilters = [
    filters.q && `Search: ${filters.q}`,
    filters.location && `Location: ${filters.location}`,
    filters.style && `Style: ${filters.style}`,
    filters.verifiedOnly && 'Verified only',
    filters.availableOnly && 'Available now',
  ].filter(Boolean);

  return (
    <div>
      <DirectoryFilters initial={filters} />

      {activeFilters.length > 0 ? (
        <ul aria-label="Active filters" className="mt-5 flex flex-wrap gap-2">
          {activeFilters.map((label) => (
            <li
              key={String(label)}
              className="rounded-pill bg-sand px-3 py-1 text-sm text-ink"
            >
              {label}
            </li>
          ))}
        </ul>
      ) : null}

      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="mt-8 text-sm text-muted"
      >
        {loading
          ? 'Finding designers…'
          : error
            ? 'Could not load designers.'
            : `${data?.total ?? 0} ${(data?.total ?? 0) === 1 ? 'designer' : 'designers'} found`}
      </p>
      <section
        aria-label="Designer results"
        aria-busy={loading}
        ref={resultsRef}
        className="mt-4 scroll-mt-28"
      >
        {error ? <ErrorNotice message={error} /> : null}
        {loading ? (
          <div
            aria-hidden="true"
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-96" />
            ))}
          </div>
        ) : data && data.items.length > 0 ? (
          <>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((designer) => (
                <DesignerCard key={designer.id} designer={designer} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={showPage} label="Designer pagination" />
          </>
        ) : !error ? (
          <EmptyState
            title="No designers match that search."
            description="Try widening your filters, or clear the search to see everyone."
            action={
              <Button
                variant="outline"
                onClick={() => router.push('/explore?tab=designers', { scroll: false })}
              >
                Clear filters
              </Button>
            }
          />
        ) : null}
      </section>
    </div>
  );
}

const filterKey = (f: Filters) =>
  JSON.stringify([f.q.trim(), f.location.trim(), f.style, f.verifiedOnly, f.availableOnly]);

function DirectoryFilters({ initial }: { initial: Filters }) {
  const router = useRouter();
  const [filters, setFilters] = useState(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inFlight = useRef(new Set<string>());
  const latest = useRef(initial);
  latest.current = initial;
  const initialKey = filterKey(initial);

  useEffect(() => {
    if (inFlight.current.delete(initialKey)) return;
    setFilters((current) =>
      filterKey(current) === initialKey ? current : latest.current,
    );
  }, [initialKey]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function apply(next: Filters, delay = 0) {
    setFilters(next);
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = undefined;
    }
    const go = () => {
      timer.current = undefined;
      inFlight.current.add(filterKey(next));
      router.push(directoryUrl(next), { scroll: false });
    };
    if (delay === 0) go();
    else timer.current = setTimeout(go, delay);
  }

  return (
    <FilterBar onSubmit={(event) => event.preventDefault()}>
      <FilterField label="Search" htmlFor="q">
        <BareInput
          id="q"
          value={filters.q}
          onChange={(event) =>
            apply({ ...filters, q: event.target.value }, 400)
          }
          placeholder="Name or keyword"
          autoComplete="off"
        />
      </FilterField>
      <FilterField label="Location" htmlFor="location">
        <Combobox
          bare
          id="location"
          value={filters.location}
          options={LOCATIONS}
          onChange={(location) => apply({ ...filters, location }, 400)}
          placeholder="Any location"
        />
      </FilterField>
      <FilterField label="Style" htmlFor="style">
        <Select
          bare
          id="style"
          value={filters.style}
          options={[
            { value: '', label: 'All styles' },
            ...STYLES.map((style) => ({ value: style, label: style })),
          ]}
          onChange={(style) => apply({ ...filters, style })}
        />
      </FilterField>
      <FilterField label="Verification" htmlFor="verified">
        <Select
          bare
          id="verified"
          value={filters.verifiedOnly}
          options={[
            { value: '', label: 'All designers' },
            { value: 'true', label: 'Verified only' },
          ]}
          onChange={(verifiedOnly) => apply({ ...filters, verifiedOnly })}
        />
      </FilterField>
      <FilterField label="Availability" htmlFor="available">
        <Select
          bare
          id="available"
          value={filters.availableOnly}
          options={[
            { value: '', label: 'Any availability' },
            { value: 'true', label: 'Available now' },
          ]}
          onChange={(availableOnly) => apply({ ...filters, availableOnly })}
        />
      </FilterField>
    </FilterBar>
  );
}
