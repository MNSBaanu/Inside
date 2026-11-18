'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { Select } from '@/components/ui/select';
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

const RANGES = [
  { value: '3', label: 'Last 3 months' },
  { value: '6', label: 'Last 6 months' },
  { value: '12', label: 'Last 12 months' },
  { value: '24', label: 'Last 24 months' },
];

export function AnalyticsSection() {
  const [range, setRange] = useState('12');
  const [exporting, setExporting] = useState(false);
  const { data, error, loading } = useApi<Analytics>(`/admin/analytics?months=${range}`);
  const rangeLabel = RANGES.find((r) => r.value === range)?.label ?? '';

  async function exportPdf() {
    if (!data) return;
    setExporting(true);
    try {
      await downloadPdf(data, rangeLabel);
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <PageHeader
        variant="app"
        eyebrow="Admin"
        title="Analytics."
        description={`Growth, revenue and activity for the ${rangeLabel.toLowerCase()}.`}
      />

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div className="w-56">
          <label htmlFor="analytics-range" className="mb-1.5 block text-sm text-muted">
            Date range
          </label>
          <Select
            id="analytics-range"
            value={range}
            options={RANGES}
            onChange={(value) => setRange(value || range)}
          />
        </div>
        <Button
          variant="outline"
          onClick={exportPdf}
          disabled={!data || loading || exporting}
        >
          <Download aria-hidden className="h-4 w-4" />
          {exporting ? 'Exporting…' : 'Export PDF'}
        </Button>
      </div>

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

async function downloadPdf(data: Analytics, rangeLabel: string) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new jsPDF();
  const { totals } = data;
  let y = 20;

  doc.setFontSize(18);
  doc.text('Inside analytics report', 14, y);
  doc.setFontSize(10);
  doc.text(`${rangeLabel} · generated ${new Date().toLocaleString('en-GB')}`, 14, (y += 7));

  const table = (title: string, head: string[], body: (string | number)[][]) => {
    autoTable(doc, {
      startY: y + 6,
      head: [[title, ...head.slice(1)]],
      body,
      headStyles: { fillColor: [60, 60, 60] },
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: head.length > 2 ? 40 : 90 } },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  };

  table('Summary', ['', 'Value'], [
    ['Revenue paid', formatMoney(totals.revenue)],
    ['Completed projects', totals.completedProjects],
    ['Proposal acceptance', totals.proposalAcceptance === null ? '-' : `${totals.proposalAcceptance}%`],
    ['Average rating', totals.averageRating === null ? '-' : totals.averageRating.toFixed(1)],
    ['Reviews', totals.reviews],
  ]);
  table(
    'Month',
    ['', 'Clients', 'Designers', 'Projects', 'Revenue'],
    data.months.map((m) => [
      `${monthLabel(m.month)} ${m.month.slice(0, 4)}`,
      m.clients,
      m.designers,
      m.projects,
      formatMoney(m.revenue),
    ]),
  );
  const breakdown = (title: string, items: Breakdown[], keepCase = false) =>
    table(
      title,
      ['', 'Count'],
      items.length
        ? items.map((i) => [keepCase ? i.key : titleCase(i.key), i.count])
        : [['No data', '']],
    );
  breakdown('Projects by status', data.projectsByStatus);
  table(
    'Payments by status',
    ['', 'Count', 'Amount'],
    data.paymentsByStatus.length
      ? data.paymentsByStatus.map((p) => [titleCase(p.key), p.count, formatMoney(p.amount ?? 0)])
      : [['No data', '', '']],
  );
  breakdown('Requests by type', data.requestsByType);
  breakdown('Top portfolio styles', data.topStyles, true);

  doc.save(`inside-analytics-${new Date().toISOString().slice(0, 10)}.pdf`);
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
