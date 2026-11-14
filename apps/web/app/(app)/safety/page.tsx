'use client';

import { cn } from '@/lib/utils/cn';
import { cardSurface } from '@/components/ui/card';
import Link from 'next/link';
import { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { api, errorMessage } from '@/lib/api/client';
import { formatDate, titleCase } from '@/lib/utils/format';
import { useApi } from '@/lib/api/use-api';
import type { Block, Report } from '@/lib/types';

export default function SafetyPage() {
  const blocks = useApi<{ items: Block[] }>('/blocks');
  const reports = useApi<{ items: Report[] }>('/reports/mine');

  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function unblock(designerId: string) {
    setActionError(null);
    setPending(designerId);
    try {
      await api.delete(`/blocks/${designerId}`);
      blocks.reload();
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setPending(null);
    }
  }

  return (
    <div>
      <PageHeader
        variant="app"
        eyebrow="Safety"
        title="Blocks and reports."
        description="People you&apos;ve blocked stay hidden from your search and can&apos;t reach you. Reports you file are reviewed by our team."
      />

      {actionError ? (
        <div className="mt-8">
          <ErrorNotice message={actionError} />
        </div>
      ) : null}

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-2">
      <section aria-labelledby="blocked-title">
        <h2 id="blocked-title" className="flex items-center gap-2 font-display text-lg font-semibold">
          Blocked people
          {blocks.data ? (
            <span className="text-sm font-normal text-muted">{blocks.data.items.length}</span>
          ) : null}
        </h2>

        <div className="mt-3">
          {blocks.loading ? (
            <Skeleton className="h-20" />
          ) : blocks.error ? (
            <ErrorNotice message={blocks.error} />
          ) : blocks.data && blocks.data.items.length > 0 ? (
            <ul className={cn(cardSurface, 'divide-y divide-hairline overflow-hidden')}>
              {blocks.data.items.map((block) => (
                <li
                  key={block.id}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar
                      name={block.blocked?.name ?? 'User'}
                      src={block.blocked?.avatarUrl ?? null}
                      size={36}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {block.blocked?.name ?? 'User'}
                      </p>
                      <p className="truncate text-sm text-muted">
                        Blocked {formatDate(block.createdAt)}
                        {block.reason ? ` · ${block.reason}` : ''}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending === block.blockedId}
                    onClick={() => unblock(block.blockedId)}
                  >
                    Unblock
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="You haven't blocked anyone." />
          )}
        </div>
      </section>

      <section aria-labelledby="reports-title">
        <h2 id="reports-title" className="flex items-center gap-2 font-display text-lg font-semibold">
          Reports you filed
          {reports.data ? (
            <span className="text-sm font-normal text-muted">{reports.data.items.length}</span>
          ) : null}
        </h2>

        <div className="mt-3">
          {reports.loading ? (
            <Skeleton className="h-20" />
          ) : reports.error ? (
            <ErrorNotice message={reports.error} />
          ) : reports.data && reports.data.items.length > 0 ? (
            <ul className={cn(cardSurface, 'divide-y divide-hairline overflow-hidden')}>
              {reports.data.items.map((report) => (
                <li key={report.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {titleCase(report.targetType)} reported
                        <span className="font-normal text-muted"> · {formatDate(report.createdAt)}</span>
                      </p>
                      <p className="mt-0.5 text-sm text-muted">
                        {report.reason}
                        {report.details ? ` · ${report.details}` : ''}
                      </p>
                    </div>
                    <StatusBadge status={report.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No reports filed."
              description="Use the report action on a profile or project if something looks wrong."
            />
          )}
        </div>
      </section>
      </div>

      <p className="mt-10 text-sm text-muted">
        Managing your profile instead?{' '}
        <Link href="/account" className="link-underline font-semibold text-ink">
          Go to account
        </Link>
      </p>
    </div>
  );
}
