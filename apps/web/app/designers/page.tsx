'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DesignerCard } from '@/components/features/designers/designer-card';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { BareInput } from '@/components/ui/field';
import { FilterAction, FilterBar, FilterField } from '@/components/ui/filter-bar';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
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

function single(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : '';
}

function directoryUrl(filters: Filters, page = 1) {
  return `/designers${buildQuery({
    ...filters,
    q: filters.q.trim(),
    location: filters.location.trim(),
    page: page > 1 ? page : undefined,
  })}`;
}

export default function DesignersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const router = useRouter();
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
    <div className="shell pb-24 pt-28 md:pb-32 md:pt-32">
      <PageHeader
        eyebrow="Designers"
        title="Find the designer for your space."
        description="Browse interior designers, see their work, and start a conversation."
      />

      <DirectoryFilters key={directoryUrl(filters, page)} initial={filters} />

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
        className="mt-4"
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
            {totalPages > 1 ? (
              <nav
                aria-label="Designer pagination"
                className="mt-12 flex items-center justify-center gap-4"
              >
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() =>
                    router.push(directoryUrl(filters, page - 1), {
                      scroll: false,
                    })
                  }
                >
                  Previous
                </Button>
                <span className="text-sm text-muted">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() =>
                    router.push(directoryUrl(filters, page + 1), {
                      scroll: false,
                    })
                  }
                >
                  Next
                </Button>
              </nav>
            ) : null}
          </>
        ) : !error ? (
          <EmptyState
            title="No designers match that search."
            description="Try widening your filters, or clear the search to see everyone."
            action={
              <Button
                variant="outline"
                onClick={() => router.push('/designers', { scroll: false })}
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

function DirectoryFilters({ initial }: { initial: Filters }) {
  const router = useRouter();
  const [filters, setFilters] = useState(initial);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    router.push(directoryUrl(filters), { scroll: false });
  }

  return (
    <FilterBar onSubmit={onSubmit} className="mt-8">
      <FilterField label="Search" htmlFor="q">
        <BareInput
          id="q"
          value={filters.q}
          onChange={(event) =>
            setFilters({ ...filters, q: event.target.value })
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
          onChange={(location) => setFilters({ ...filters, location })}
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
          onChange={(style) => setFilters({ ...filters, style })}
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
          onChange={(verifiedOnly) => setFilters({ ...filters, verifiedOnly })}
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
          onChange={(availableOnly) =>
            setFilters({ ...filters, availableOnly })
          }
        />
      </FilterField>
      <FilterAction>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setFilters({
              q: '',
              location: '',
              style: '',
              verifiedOnly: '',
              availableOnly: '',
            });
            router.push('/designers', { scroll: false });
          }}
        >
          Clear
        </Button>
        <Button type="submit" size="sm">
          Apply filters
        </Button>
      </FilterAction>
    </FilterBar>
  );
}
