'use client';

import Link from 'next/link';
import { useSession } from '@/components/providers/session-provider';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate, formatMoney } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { ProjectRequest } from '@/lib/types';

export default function RequestsPage() {
  const { user } = useSession();
  const { data, error, loading } =
    useApi<{ items: ProjectRequest[] }>('/requests');
  const isClient = user?.activeRole === 'CLIENT';

  return (
    <div>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge tone="clay">Requests</Badge>
          <h1 className="mt-6 font-display text-section font-semibold">
            {isClient ? 'Your requests.' : 'Work coming your way.'}
          </h1>
          <p className="mt-4 max-w-xl text-muted">
            {isClient
              ? 'Requests you have sent to designers, and open requests awaiting proposals.'
              : 'Direct requests sent to you, plus open requests you can propose on.'}
          </p>
        </div>
        {isClient ? (
          <ButtonLink href="/requests/new" size="lg">
            New request
          </ButtonLink>
        ) : null}
      </div>

      <div className="mt-12">
        {error ? <ErrorNotice message={error} /> : null}

        {loading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        ) : data && data.items.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {data.items.map((request) => (
              <li key={request.id}>
                <Link
                  href={`/requests/${request.id}`}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-hairline bg-surface p-6 transition-colors duration-300 hover:border-clay"
                >
                  <div className="min-w-0">
                    <p className="font-display text-xl font-semibold">
                      {request.title}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {request.type === 'DIRECT' ? 'Direct' : 'Open'} ·{' '}
                      {formatDate(request.createdAt)}
                      {request.budget !== null
                        ? ` · ${formatMoney(request.budget)}`
                        : ''}
                    </p>
                  </div>
                  <StatusBadge status={request.status} />
                </Link>
              </li>
            ))}
          </ul>
        ) : !error ? (
          <EmptyState
            title={isClient ? 'No requests yet.' : 'Nothing waiting on you.'}
            description={
              isClient
                ? 'Send a request to a designer you like, or open one to the whole platform.'
                : 'When a client sends you a request, or opens one publicly, it shows up here.'
            }
            action={
              isClient ? (
                <ButtonLink href="/requests/new">New request</ButtonLink>
              ) : (
                <ButtonLink href="/portfolios/manage">
                  Publish more work
                </ButtonLink>
              )
            }
          />
        ) : null}
      </div>
    </div>
  );
}
