'use client';

import { useState } from 'react';
import { PortfolioCard } from '@/components/portfolios/portfolio-card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/page-header';
import { buildQuery, useApi } from '@/lib/use-api';
import type { Paginated, Portfolio } from '@/lib/types';

const PAGE_SIZE = 12;

export default function PortfoliosPage() {
  const [filters, setFilters] = useState({
    style: '',
    roomType: '',
    maxBudget: '',
  });
  const [applied, setApplied] = useState(filters);
  const [page, setPage] = useState(1);

  const query = buildQuery({
    style: applied.style,
    roomType: applied.roomType,
    maxBudget: applied.maxBudget,
    page,
    pageSize: PAGE_SIZE,
  });

  const { data, error, loading } = useApi<Paginated<Portfolio>>(
    `/portfolios${query}`,
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
        eyebrow="Work"
        title="Rooms that earned their brief."
        description="Published projects from designers across the platform."
      />

      <form
        onSubmit={onSubmit}
        className="mt-12 grid gap-4 rounded-card border border-hairline bg-surface p-6 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end"
      >
        <Field label="Style" htmlFor="style">
          <Input
            id="style"
            value={filters.style}
            onChange={(event) =>
              setFilters({ ...filters, style: event.target.value })
            }
            placeholder="Scandinavian"
          />
        </Field>
        <Field label="Room type" htmlFor="roomType">
          <Input
            id="roomType"
            value={filters.roomType}
            onChange={(event) =>
              setFilters({ ...filters, roomType: event.target.value })
            }
            placeholder="Living room"
          />
        </Field>
        <Field label="Max budget" htmlFor="maxBudget">
          <Input
            id="maxBudget"
            type="number"
            min={0}
            value={filters.maxBudget}
            onChange={(event) =>
              setFilters({ ...filters, maxBudget: event.target.value })
            }
            placeholder="800000"
          />
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
              <Skeleton key={index} className="h-80" />
            ))}
          </div>
        ) : data && data.items.length > 0 ? (
          <>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((portfolio) => (
                <PortfolioCard key={portfolio.id} portfolio={portfolio} />
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
            title="No projects match those filters."
            description="Try a different style, room type or budget."
          />
        ) : null}
      </div>
    </div>
  );
}
