'use client';

import { cn } from '@/lib/utils/cn';
import { cardSurface } from '@/components/ui/card';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button, ButtonLink } from '@/components/ui/button';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/page-header';
import { formatDate, formatMoney } from '@/lib/utils/format';
import { buildQuery, useApi } from '@/lib/api/use-api';
import type { OpenRequest, Paginated } from '@/lib/types';

const PAGE_SIZE = 12;

export default function OpenProjectsPage() {
  const [page, setPage] = useState(1);
  const { data, error, loading } = useApi<Paginated<OpenRequest>>(
    `/requests/open${buildQuery({ page, pageSize: PAGE_SIZE })}`,
  );

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="shell py-32 md:py-40">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <PageHeader
          eyebrow="Open projects"
          title="Projects looking for a designer."
          description="Clients post the space, budget and timeline. Designers reply with a proposal covering scope, timeline and stage fees."
        />
        <ButtonLink href="/requests/new" size="lg" className="shrink-0">
          Post a project
        </ButtonLink>
      </div>

      <div className="mt-12">
        {error ? <ErrorNotice message={error} /> : null}

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-64" />
            ))}
          </div>
        ) : data && data.items.length > 0 ? (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              {data.items.map((request) => (
                <OpenRequestCard key={request.id} request={request} />
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
            title="No open projects right now."
            description="Check back soon, or post your own project to hear from designers."
          />
        ) : null}
      </div>
    </div>
  );
}

function OpenRequestCard({ request }: { request: OpenRequest }) {
  const tags = [...request.rooms, ...request.styles];

  return (
    <article className={cn(cardSurface, 'flex h-full flex-col p-6 md:p-8')}>
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold">{request.title}</h2>
        <span className="whitespace-nowrap text-sm text-muted">
          {formatDate(request.createdAt)}
        </span>
      </div>

      {request.description ? (
        <p className="mt-3 line-clamp-3 text-muted">{request.description}</p>
      ) : null}

      {tags.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      ) : null}

      <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-hairline pt-5 text-sm">
        <div>
          <dt className="label text-muted">Budget</dt>
          <dd className="mt-1 font-semibold">{formatMoney(request.budget)}</dd>
        </div>
        <div>
          <dt className="label text-muted">Location</dt>
          <dd className="mt-1 font-semibold">{request.location ?? '-'}</dd>
        </div>
        <div>
          <dt className="label text-muted">Timeline</dt>
          <dd className="mt-1 font-semibold">{request.timeline ?? '-'}</dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center justify-between gap-4 pt-6">
        <span className="text-sm text-muted">
          {request.proposalCount}{' '}
          {request.proposalCount === 1 ? 'proposal' : 'proposals'} so far
        </span>
        <ButtonLink href={`/requests/${request.id}`} variant="outline">
          Send proposal
        </ButtonLink>
      </div>
    </article>
  );
}
