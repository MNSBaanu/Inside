'use client';

import { cn } from '@/lib/utils/cn';
import { cardSurface } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button, ButtonLink } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { BareInput } from '@/components/ui/field';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { FilterBar, FilterField } from '@/components/ui/filter-bar';
import { PageHeader } from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { LOCATIONS } from '@/lib/utils/options';
import { formatDate, formatMoney } from '@/lib/utils/format';
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
            <div className={cn(cardSurface, 'overflow-hidden')}>
              <div className="flex items-center justify-between border-b border-hairline px-5 py-4 md:px-6">
                <h2 className="font-semibold">
                  {SORT_OPTIONS.find((option) => option.value === applied.sort)
                    ?.label ?? 'Newest first'}
                </h2>
                <span className="text-sm text-muted">
                  {data.total} open {data.total === 1 ? 'project' : 'projects'}
                </span>
              </div>
              <ul className="divide-y divide-hairline">
                {data.items.map((request) => (
                  <OpenRequestRow key={request.id} request={request} />
                ))}
              </ul>
            </div>

            {totalPages > 1 ? (
              <div className="mt-16 flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => showPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="label text-muted">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => showPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            ) : null}
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
    </div>
  );
}

function postedAgo(value: string) {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days <= 0) return 'Posted today';
  if (days === 1) return 'Posted yesterday';
  if (days < 30) return `Posted ${days} days ago`;
  return `Posted ${formatDate(value)}`;
}

function OpenRequestRow({ request }: { request: OpenRequest }) {
  const tags = [...request.rooms, ...request.styles];
  const href = `/requests/${request.id}`;

  return (
    <li className="group relative px-5 py-5 transition-colors duration-200 hover:bg-sand/60 md:px-6">
      <p className="text-xs text-muted">{postedAgo(request.createdAt)}</p>
      <h3 className="mt-1 text-lg font-semibold leading-snug">
        <Link
          href={href}
          className="after:absolute after:inset-0 group-hover:text-brand group-hover:underline"
        >
          {request.title}
        </Link>
      </h3>

      <p className="mt-2 text-sm text-muted">
        Fixed price
        <span aria-hidden> · </span>
        Budget:{' '}
        <span className="font-semibold text-ink">
          {formatMoney(request.budget)}
        </span>
        {request.timeline ? (
          <>
            <span aria-hidden> · </span>
            Timeline:{' '}
            <span className="font-semibold text-ink">{request.timeline}</span>
          </>
        ) : null}
      </p>

      {request.description ? (
        <p className="mt-3 line-clamp-3 max-w-3xl text-sm">
          {request.description}
        </p>
      ) : null}

      {tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
        <span>
          Proposals:{' '}
          <span className="font-semibold text-ink">{request.proposalCount}</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin aria-hidden className="h-3.5 w-3.5" />
          {request.location ?? 'Location not set'}
        </span>
      </div>
    </li>
  );
}
