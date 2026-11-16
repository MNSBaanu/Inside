'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ButtonLink } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Combobox } from '@/components/ui/combobox';
import { BareInput } from '@/components/ui/field';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { OpenRequestCard } from '@/components/features/open-projects/open-request-card';
import { OpenRequestDrawer } from '@/components/features/open-projects/open-request-drawer';
import { FilterBar, FilterField } from '@/components/ui/filter-bar';
import { PageHeader } from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { LOCATIONS } from '@/lib/utils/options';
import { buildQuery, useApi } from '@/lib/api/use-api';
import type { OpenRequest, Paginated } from '@/lib/types';

const PAGE_SIZE = 12;

const EMPTY_FILTERS = {
  q: '',
  location: '',
  minBudget: '',
  maxBudget: '',
  sort: 'newest',
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'budget_high', label: 'Highest budget' },
  { value: 'budget_low', label: 'Lowest budget' },
];

export default function OpenProjectsPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<OpenRequest | null>(null);
  const closeDrawer = useCallback(() => setSelected(null), []);
  const resultsRef = useRef<HTMLDivElement>(null);
  const showPage = (next: number) => {
    setPage(next);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const { data, error, loading } = useApi<Paginated<OpenRequest>>(
    `/requests/open${buildQuery({ ...applied, page, pageSize: PAGE_SIZE })}`,
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setApplied(filters);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const filtered =
    filters.q !== '' ||
    filters.location !== '' ||
    filters.minBudget !== '' ||
    filters.maxBudget !== '';

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="shell py-32 md:py-40">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <PageHeader
          eyebrow="Open projects"
          title="Projects looking for a designer."
          description="Clients post the space, budget and timeline. Designers reply with a proposal covering scope, timeline and stage fees."
        />
        <ButtonLink href="/requests/new" size="lg" className="shrink-0">
          Post a project
        </ButtonLink>
      </div>

      <FilterBar onSubmit={(event) => event.preventDefault()} className="mt-12">
        <FilterField label="Search" htmlFor="q">
          <BareInput
            id="q"
            type="search"
            value={filters.q}
            onChange={(event) => setFilters({ ...filters, q: event.target.value })}
            placeholder="Kitchen, bedroom, verandah"
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
            placeholder="Anywhere"
          />
        </FilterField>
        <FilterField label="Budget from" htmlFor="minBudget">
          <BareInput
            id="minBudget"
            type="number"
            min={0}
            value={filters.minBudget}
            onChange={(event) =>
              setFilters({ ...filters, minBudget: event.target.value })
            }
            placeholder="Any"
            autoComplete="off"
          />
        </FilterField>
        <FilterField label="Budget up to" htmlFor="maxBudget">
          <BareInput
            id="maxBudget"
            type="number"
            min={0}
            value={filters.maxBudget}
            onChange={(event) =>
              setFilters({ ...filters, maxBudget: event.target.value })
            }
            placeholder="Any"
            autoComplete="off"
          />
        </FilterField>
        <FilterField label="Sort" htmlFor="sort">
          <Select
            bare
            id="sort"
            value={filters.sort}
            options={SORT_OPTIONS}
            onChange={(sort) => setFilters({ ...filters, sort })}
          />
        </FilterField>
      </FilterBar>

      <div ref={resultsRef} className="mt-10 scroll-mt-28">
        {error ? <ErrorNotice message={error} /> : null}

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-44" />
            ))}
          </div>
        ) : data && data.items.length > 0 ? (
          <>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-semibold">
                {SORT_OPTIONS.find((option) => option.value === applied.sort)
                  ?.label ?? 'Newest first'}
              </h2>
              <span className="text-sm text-muted">
                {data.total} open {data.total === 1 ? 'project' : 'projects'}
              </span>
            </div>
            <ul className="flex flex-col gap-4">
              {data.items.map((request) => (
                <OpenRequestCard
                  key={request.id}
                  request={request}
                  onOpen={() => setSelected(request)}
                />
              ))}
            </ul>

            <Pagination page={page} totalPages={totalPages} onPageChange={showPage} />
          </>
        ) : !error ? (
          filtered ? (
            <EmptyState
              title="No open projects match those filters."
              description="Try a different search, location or budget."
            />
          ) : (
            <EmptyState
              title="No open projects right now."
              description="Check back soon, or post your own project to hear from designers."
            />
          )
        ) : null}
      </div>

      {selected ? (
        <OpenRequestDrawer request={selected} onClose={closeDrawer} />
      ) : null}
    </div>
  );
}
