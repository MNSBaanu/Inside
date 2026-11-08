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

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Blocked people</h2>

        <div className="mt-6">
          {blocks.loading ? (
            <Skeleton className="h-24" />
          ) : blocks.error ? (
            <ErrorNotice message={blocks.error} />
          ) : blocks.data && blocks.data.items.length > 0 ? (
            <ul className="flex flex-col gap-4">
              {blocks.data.items.map((block) => (
                <li
                  key={block.id}
                  className={cn(cardSurface, 'flex flex-wrap items-center justify-between gap-4 p-6')}
                >
                  <div className="flex items-center gap-4">
                    <Avatar
                      name={block.blocked?.name ?? 'User'}
                      src={block.blocked?.avatarUrl ?? null}
                      size={48}
                    />
                    <div>
                      <p className="font-display text-xl font-semibold">
                        {block.blocked?.name ?? 'User'}
                      </p>
                      <p className="mt-1 text-sm text-muted">
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

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold">Reports you filed</h2>

        <div className="mt-6">
          {reports.loading ? (
            <Skeleton className="h-24" />
          ) : reports.error ? (
            <ErrorNotice message={reports.error} />
          ) : reports.data && reports.data.items.length > 0 ? (
            <ul className="flex flex-col gap-4">
              {reports.data.items.map((report) => (
                <li
                  key={report.id}
                  className={cn(cardSurface, 'p-6')}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-display text-xl font-semibold">
                        {titleCase(report.targetType)} reported
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {formatDate(report.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={report.status} />
                  </div>

                  <p className="mt-4 text-muted">{report.reason}</p>
                  {report.details ? (
                    <p className="mt-2 text-sm text-muted">{report.details}</p>
                  ) : null}
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

      <p className="mt-12 text-sm text-muted">
        Managing your profile instead?{' '}
        <Link href="/account" className="link-underline font-semibold text-ink">
          Go to account
        </Link>
      </p>
    </div>
  );
}
