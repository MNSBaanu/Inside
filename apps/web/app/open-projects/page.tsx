'use client';

import { useCallback, useState } from 'react';
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
import { usePagedSearch } from '@/lib/api/use-paged-search';
import type { OpenRequest } from '@/lib/types';

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
  } = usePagedSearch<OpenRequest, typeof EMPTY_FILTERS>(
    '/requests/open',
    EMPTY_FILTERS,
    PAGE_SIZE,
  );
  const [selected, setSelected] = useState<OpenRequest | null>(null);
  const closeDrawer = useCallback(() => setSelected(null), []);

  const filtered =
    filters.q !== '' ||
    filters.location !== '' ||
    filters.minBudget !== '' ||
    filters.maxBudget !== '';

  return (
    <div className="shell page">
      <PageHeader
        eyebrow="Open projects"
        title="Projects looking for a designer."
        description="Clients post the space, budget and timeline. Designers reply with a proposal covering scope, timeline and stage fees."
        action={<ButtonLink href="/requests/new">Post a project</ButtonLink>}
      />

      <FilterBar onSubmit={(event) => event.preventDefault()} className="mt-8">
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
            <p className="mb-4 text-sm text-muted">
              {data.total} open {data.total === 1 ? 'project' : 'projects'}
            </p>
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
