'use client';

import { cn } from '@/lib/utils/cn';
import { cardSurface } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate, formatMoney } from '@/lib/utils/format';
import { useApi } from '@/lib/api/use-api';
import type { ProjectRequest, RequestStatus, RequestType } from '@/lib/types';

const STATUSES: RequestStatus[] = [
  'PENDING',
  'OPEN',
  'ACCEPTED',
  'REJECTED',
  'CANCELLED',
  'CLOSED',
];

function readable(status: string) {
  const words = status.toLowerCase().replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function otherParty(request: ProjectRequest, isClient: boolean) {
  const party = isClient ? request.designer : request.client;
  return party?.name ? ` · ${isClient ? 'To' : 'From'} ${party.name}` : '';
}

export default function RequestsPage() {
  const { user } = useSession();
  const { data, error, loading } =
    useApi<{ items: ProjectRequest[] }>('/requests');
  const isClient = user?.activeRole === 'CLIENT';
  const [filter, setFilter] = useState<RequestStatus | null>(null);
  const [kind, setKind] = useState<RequestType>('DIRECT');

  const all = data?.items ?? [];
  const kinds: { type: RequestType; label: string }[] = [
    { type: 'DIRECT', label: isClient ? 'Sent to a designer' : 'Sent to you' },
    { type: 'OPEN', label: 'Open requests' },
  ];
  const items = all.filter((request) => request.type === kind);
  const counts = items.reduce<Partial<Record<RequestStatus, number>>>(
    (acc, request) => ({ ...acc, [request.status]: (acc[request.status] ?? 0) + 1 }),
    {},
  );
  const visible = filter ? items.filter((request) => request.status === filter) : items;

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

      <div className="mt-8">
        {error ? <ErrorNotice message={error} /> : null}

        {loading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : data && data.items.length > 0 ? (
          <>
            <div role="tablist" aria-label="Request type" className="mb-5 flex gap-6 border-b border-hairline">
              {kinds.map(({ type, label }) => {
                const active = kind === type;
                const count = all.filter((request) => request.type === type).length;
                return (
                  <button
                    key={type}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setKind(type);
                      setFilter(null);
                    }}
                    className={cn(
                      '-mb-px inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold transition-colors',
                      active
                        ? 'border-brand text-brand'
                        : 'border-transparent text-muted hover:text-ink',
                    )}
                  >
                    {label}
                    <span
                      className={cn(
                        'rounded-pill px-2 py-0.5 text-xs',
                        active ? 'bg-brand-soft text-brand-deep' : 'bg-sand text-ink/70',
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {items.length > 0 ? (
            <div
              role="group"
              aria-label="Filter by status"
              className="mb-4 flex flex-wrap gap-2"
            >
              {[null, ...STATUSES.filter((status) => counts[status])].map((status) => {
                const active = filter === status;
                return (
                  <button
                    key={status ?? 'ALL'}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFilter(status)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                      active
                        ? 'border-brand bg-brand text-canvas'
                        : 'border-hairline bg-surface text-ink/80 hover:border-brand hover:text-brand',
                    )}
                  >
                    {status ? readable(status) : 'All'}
                    <span className={active ? 'text-canvas/80' : 'text-muted'}>
                      {status ? counts[status] : items.length}
                    </span>
                  </button>
                );
              })}
            </div>
            ) : null}

            {items.length === 0 ? (
              <EmptyState
                title={kind === 'OPEN' ? 'No open requests.' : 'No direct requests.'}
                description={
                  kind === 'OPEN'
                    ? isClient
                      ? 'Open a request to every designer and compare the proposals that come back.'
                      : 'Open requests you send a proposal on show up here.'
                    : isClient
                      ? 'Send a request straight to a designer from their profile.'
                      : 'Requests clients send straight to you show up here.'
                }
              />
            ) : visible.length > 0 ? (
              <ul className={cn(cardSurface, 'divide-y divide-hairline overflow-hidden')}>
                {visible.map((request) => (
                  <li key={request.id}>
                    <Link
                      href={`/requests/${request.id}`}
                      className="group grid items-center gap-x-6 gap-y-2 px-5 py-4 transition-colors duration-200 hover:bg-sand/50 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold group-hover:text-brand">
                          {request.title}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-muted">
                          {request.type === 'DIRECT' ? 'Direct' : 'Open'} ·{' '}
                          {formatDate(request.createdAt)}
                          {otherParty(request, isClient)}
                        </p>
                      </div>
                      <p className="text-sm font-medium md:text-right">
                        {request.budget !== null ? formatMoney(request.budget) : (
                          <span className="text-muted">No budget</span>
                        )}
                      </p>
                      <StatusBadge status={request.status} />
                      <ChevronRight
                        aria-hidden
                        className="hidden h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand md:block"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No requests with this status."
                description="Pick another status or show all requests."
              />
            )}
          </>
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
