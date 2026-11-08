'use client';

import { cn } from '@/lib/utils/cn';
import { cardSurface } from '@/components/ui/card';
import Link from 'next/link';
import { useSession } from '@/components/providers/session-provider';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate, formatMoney } from '@/lib/utils/format';
import { useApi } from '@/lib/api/use-api';
import type { ProjectRequest } from '@/lib/types';

export default function RequestsPage() {
  const { user } = useSession();
  const { data, error, loading } =
    useApi<{ items: ProjectRequest[] }>('/requests');
  const isClient = user?.activeRole === 'CLIENT';

  return (
    <div>
      <PageHeader
        variant="app"
        eyebrow="Requests"
        title={isClient ? 'Your requests.' : 'Work coming your way.'}
        description={
          isClient
            ? 'Requests you have sent to designers, and open requests awaiting proposals.'
            : 'Direct requests sent to you, plus open requests you can propose on.'
        }
        action={
          isClient ? (
            <ButtonLink href="/requests/new" size="lg">
              New request
            </ButtonLink>
          ) : null
        }
      />

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
                  className={cn(cardSurface, 'flex flex-wrap items-center justify-between gap-4 p-6 transition-colors duration-300 hover:border-brand')}
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
