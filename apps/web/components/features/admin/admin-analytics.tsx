'use client';

import { ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/page-header';
import { cardSurface } from '@/components/ui/card';
import { useApi } from '@/lib/api/use-api';
import { cn } from '@/lib/utils/cn';
import { formatMoney, titleCase } from '@/lib/utils/format';

type Month = {
  month: string;
  clients: number;
  designers: number;
  projects: number;
  revenue: number;
};

type Breakdown = { key: string; count: number; amount?: number };

type Analytics = {
  totals: {
    revenue: number;
    completedProjects: number;
    proposalAcceptance: number | null;
    averageRating: number | null;
    reviews: number;
  };
  months: Month[];
  projectsByStatus: Breakdown[];
  paymentsByStatus: Breakdown[];
  requestsByType: Breakdown[];
  topStyles: Breakdown[];
};

const monthLabel = (month: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleString('en-GB', {
    month: 'short',
    timeZone: 'UTC',
  });

export function AnalyticsSection() {
  const { data, error, loading } = useApi<Analytics>('/admin/analytics');

  return (
    <>
      <PageHeader
        variant="app"
        eyebrow="Admin"
        title="Analytics."
        description="Growth, revenue and activity over the last 12 months."
      />

      {error ? (
        <div className="mt-6">
          <ErrorNotice message={error} />
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Revenue paid" value={data ? formatMoney(data.totals.revenue) : undefined} />
        <Kpi label="Completed projects" value={data?.totals.completedProjects.toString()} />
        <Kpi
          label="Proposal acceptance"
          value={
            data
              ? data.totals.proposalAcceptance === null
                ? '-'
                : `${data.totals.proposalAcceptance}%`
              : undefined
          }
        />
        <Kpi
          label="Average rating"
          value={
            data
              ? data.totals.averageRating === null
                ? '-'
                : data.totals.averageRating.toFixed(1)
              : undefined
          }
          note={data ? `${data.totals.reviews} reviews` : undefined}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <MonthlyChart
          title="New users"
          months={data?.months}
          loading={loading}
          series={[
            { key: 'clients', label: 'Clients', className: 'bg-brand' },
            { key: 'designers', label: 'Designers', className: 'bg-brand/40' },
          ]}
        />
        <MonthlyChart
          title="Projects started"
          months={data?.months}
          loading={loading}
          series={[{ key: 'projects', label: 'Projects', className: 'bg-brand' }]}
        />
        <MonthlyChart
          title="Revenue paid"
          months={data?.months}
          loading={loading}
          format={formatMoney}
          series={[{ key: 'revenue', label: 'Revenue', className: 'bg-brand' }]}
          className="lg:col-span-2"
        />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <BreakdownList title="Projects by status" items={data?.projectsByStatus} />
        <BreakdownList title="Payments by status" items={data?.paymentsByStatus} showAmount />
        <BreakdownList title="Requests by type" items={data?.requestsByType} />
        <BreakdownList title="Top portfolio styles" items={data?.topStyles} keepCase />
      </div>
    </>
  );
}

function Kpi({ label, value, note }: { label: string; value?: string; note?: string }) {
  return (
    <div className="rounded-card bg-sand p-5">
      {value === undefined ? (
        <Skeleton className="h-8 w-20 bg-canvas" />
      ) : (
        <p className="font-display text-3xl font-semibold leading-none text-brand">{value}</p>
      )}
      <p className="mt-1.5 text-sm text-ink/70">{label}</p>
      {note ? <p className="text-xs text-muted">{note}</p> : null}
    </div>
  );
}

type SeriesKey = 'clients' | 'designers' | 'projects' | 'revenue';

function MonthlyChart({
  title,
  months,
  loading,
  series,
  format = (value: number) => value.toString(),
  className,
}: {
  title: string;
  months?: Month[];
  loading: boolean;
  series: { key: SeriesKey; label: string; className: string }[];
  format?: (value: number) => string;
  className?: string;
}) {
  const totals = months?.map((m) => series.reduce((sum, s) => sum + m[s.key], 0)) ?? [];
  const max = Math.max(1, ...totals);

  return (
    <section className={cn(cardSurface, 'p-5', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {series.length > 1 ? (
          <div className="flex gap-4 text-xs text-muted">
            {series.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-1.5">
                <span aria-hidden className={cn('h-2.5 w-2.5 rounded-sm', s.className)} />
                {s.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {loading || !months ? (
        <Skeleton className="mt-4 h-40 w-full" />
      ) : (
        <div className="mt-4 flex h-40 items-end gap-1.5" role="list" aria-label={title}>
          {months.map((m, index) => (
            <div
              key={m.month}
              role="listitem"
              aria-label={`${monthLabel(m.month)}: ${series
                .map((s) => `${s.label} ${format(m[s.key])}`)
                .join(', ')}`}
              title={`${monthLabel(m.month)} ${m.month.slice(0, 4)}: ${format(totals[index])}`}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
            >
              <div className="flex w-full flex-col-reverse overflow-hidden rounded-t">
                {series.map((s) => (
                  <div
                    key={s.key}
                    className={s.className}
                    style={{ height: `${(m[s.key] / max) * 128}px` }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-muted">{monthLabel(m.month)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function BreakdownList({
  title,
  items,
  showAmount = false,
  keepCase = false,
}: {
  title: string;
  items?: Breakdown[];
  showAmount?: boolean;
  keepCase?: boolean;
}) {
  const max = Math.max(1, ...(items ?? []).map((i) => i.count));

  return (
    <section className={cn(cardSurface, 'p-5')}>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {!items ? (
        <Skeleton className="mt-4 h-24 w-full" />
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No data yet.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.key}>
              <div className="flex justify-between gap-3 text-sm">
                <span>{keepCase ? item.key : titleCase(item.key)}</span>
                <span className="text-muted">
                  {item.count}
                  {showAmount && item.amount !== undefined ? ` · ${formatMoney(item.amount)}` : ''}
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-sand">
                <div
                  className="h-2 rounded-full bg-brand"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
