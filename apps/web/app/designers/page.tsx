'use client';

import { useEffect, useState } from 'react';
import { DesignerCard } from '@/components/designers/designer-card';
import { LocationCombobox } from '@/components/designers/location-combobox';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { buildQuery, useApi } from '@/lib/use-api';
import type { DesignerSummary, Paginated } from '@/lib/types';

const PAGE_SIZE = 12;

const LOCATIONS = [
  'Ampara',
  'Anuradhapura',
  'Badulla',
  'Batticaloa',
  'Colombo',
  'Galle',
  'Gampaha',
  'Hambantota',
  'Jaffna',
  'Kalutara',
  'Kandy',
  'Kegalle',
  'Kilinochchi',
  'Kurunegala',
  'Mannar',
  'Matale',
  'Matara',
  'Monaragala',
  'Mullaitivu',
  'Negombo',
  'Nuwara Eliya',
  'Polonnaruwa',
  'Puttalam',
  'Ratnapura',
  'Trincomalee',
  'Vavuniya',
];

const EMPTY_FILTERS = { q: '', location: '', verified: '' };

export default function DesignersPage({
  searchParams,
}: {
  searchParams: { q?: string; location?: string };
}) {
  const [filters, setFilters] = useState({
    q: searchParams.q ?? '',
    location: searchParams.location ?? '',
    verified: '',
  });
  const [applied, setApplied] = useState(filters);
  const [page, setPage] = useState(1);

  const query = buildQuery({
    q: applied.q,
    location: applied.location,
    verifiedOnly: applied.verified === 'verified' ? 'true' : undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const { data, error, loading } = useApi<Paginated<DesignerSummary>>(
    `/designers${query}`,
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setApplied(filters);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="shell py-32 md:py-40">
      <PageHeader
        eyebrow="Designers"
        title="Find the designer for your space."
        description="Browse verified interior designers, see their work, and start a conversation."
      />

      <form
        onSubmit={onSubmit}
        className="mt-12 grid gap-4 rounded-card border border-hairline bg-surface p-6 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end"
      >
        <Field label="Search" htmlFor="q">
          <Input
            id="q"
            value={filters.q}
            onChange={(event) =>
              setFilters({ ...filters, q: event.target.value })
            }
            placeholder="Name or keyword"
            autoComplete="off"
          />
        </Field>
        <Field label="Location" htmlFor="location">
          <LocationCombobox
            id="location"
            value={filters.location}
            options={LOCATIONS}
            onChange={(location) => setFilters({ ...filters, location })}
            placeholder="Colombo"
          />
        </Field>
        <Field label="Status" htmlFor="verified">
          <Select
            id="verified"
            value={filters.verified}
            options={[
              { value: '', label: 'All designers' },
              { value: 'verified', label: 'Verified only' },
            ]}
            onChange={(verified) => setFilters({ ...filters, verified })}
          />
        </Field>
        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={() => setFilters(EMPTY_FILTERS)}
        >
          Clear
        </Button>
      </form>

      <div className="mt-12">
        {error ? <ErrorNotice message={error} /> : null}

        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
            title="No designers match that search."
            description="Try widening your filters, or clear the search to see everyone."
          />
        ) : null}
      </div>
    </div>
  );
}
