'use client';

import { useState } from 'react';
import { DesignerCard } from '@/components/designers/designer-card';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/page-header';
import { buildQuery, useApi } from '@/lib/use-api';
import type { DesignerSummary, Paginated } from '@/lib/types';

const PAGE_SIZE = 12;

export default function DesignersPage() {
  const [filters, setFilters] = useState({ q: '', location: '', verified: '' });
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

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPage(1);
    setApplied(filters);
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
          />
        </Field>
        <Field label="Location" htmlFor="location">
          <Input
            id="location"
            value={filters.location}
            onChange={(event) =>
              setFilters({ ...filters, location: event.target.value })
            }
            placeholder="Colombo"
          />
        </Field>
        <Field label="Status" htmlFor="verified">
          <Select
            id="verified"
            value={filters.verified}
            onChange={(event) =>
              setFilters({ ...filters, verified: event.target.value })
            }
          >
            <option value="">All designers</option>
            <option value="verified">Verified only</option>
          </Select>
        </Field>
        <Button type="submit" size="lg">
          Apply
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
