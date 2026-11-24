'use client';

import { PortfolioGrid } from '@/components/features/portfolios/portfolio-grid';
import { Pagination } from '@/components/ui/pagination';
import { Combobox } from '@/components/ui/combobox';
import { BareInput } from '@/components/ui/field';
import { FilterBar, FilterField } from '@/components/ui/filter-bar';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { LOCATIONS, ROOM_TYPES, STYLES } from '@/lib/utils/options';
import { usePagedSearch } from '@/lib/api/use-paged-search';
import type { Portfolio } from '@/lib/types';

const PAGE_SIZE = 12;

export function ProjectsExplorer({
  style,
  roomType,
}: {
  style?: string;
  roomType?: string;
}) {
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
  } = usePagedSearch<Portfolio, Record<string, string>>(
    '/portfolios',
    {
      q: '',
      location: '',
      style: style ?? '',
      roomType: roomType ?? '',
      maxBudget: '',
    },
    PAGE_SIZE,
  );

  return (
    <div>
      <FilterBar onSubmit={(event) => event.preventDefault()}>
        <FilterField label="Search" htmlFor="q">
          <BareInput
            id="q"
            type="search"
            value={filters.q}
            onChange={(event) =>
              setFilters({ ...filters, q: event.target.value })
            }
            placeholder="Oak, courtyard, designer"
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
        <FilterField label="Room" htmlFor="roomType">
          <Combobox
            bare
            id="roomType"
            value={filters.roomType}
            options={ROOM_TYPES}
            onChange={(roomType) => setFilters({ ...filters, roomType })}
            placeholder="Any room"
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
            placeholder="Any budget"
            autoComplete="off"
          />
        </FilterField>
      </FilterBar>

      <div ref={resultsRef} className="mt-10 scroll-mt-28">
        {error ? <ErrorNotice message={error} /> : null}

        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-80" />
            ))}
          </div>
        ) : data && data.items.length > 0 ? (
          <>
            <PortfolioGrid items={data.items} />

            <Pagination page={page} totalPages={totalPages} onPageChange={showPage} />
          </>
        ) : !error ? (
          <EmptyState
            title="No projects match those filters."
            description="Try a different search, location, style, room type or budget."
          />
        ) : null}
      </div>
    </div>
  );
}
