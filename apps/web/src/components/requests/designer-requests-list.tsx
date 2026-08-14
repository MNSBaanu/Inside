'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/layout/empty-state';
import { InlineAlert } from '@/components/layout/inline-alert';
import { SkeletonList } from '@/components/layout/skeleton';
import { StatusBadge } from '@/components/requests/status-badge';
import { formatApiError } from '@/lib/api/auth';
import { listRequests } from '@/lib/api/requests';
import type { ProjectRequest } from '@/lib/api/types';
import { DEMO_BEDROOM } from '@/lib/media';
import { formatLkr } from '@/lib/stages';
import { cn } from '@/lib/utils';

function RequestRow({ request }: { request: ProjectRequest }) {
  return (
    <li className="surface-panel space-y-3 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={request.status} />
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {request.proposalCount}{' '}
              {request.proposalCount === 1 ? 'proposal' : 'proposals'}
            </span>
          </div>
          <Link
            href={`/designer/requests/${request.id}`}
            className="block font-heading text-xl tracking-tight hover:underline"
          >
            {request.title}
          </Link>
          <p className="text-sm text-muted-foreground">
            {request.client ? `${request.client.name} · ` : ''}
            {formatLkr(request.budget)}
            {request.brief
              ? ` · ${request.brief.styles.slice(0, 2).join(', ')} · ${request.brief.rooms.slice(0, 2).join(', ')}`
              : ''}
          </p>
        </div>
        <Link
          href={`/designer/requests/${request.id}`}
          className={cn(buttonVariants({ size: 'sm' }))}
        >
          View & propose
        </Link>
      </div>
      {request.description ? (
        <p className="line-clamp-2 text-sm leading-relaxed text-foreground/85">
          {request.description}
        </p>
      ) : null}
    </li>
  );
}

export function DesignerRequestsList() {
  const [items, setItems] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listRequests();
        if (!cancelled) setItems(data.items);
      } catch (err) {
        if (!cancelled) setError(formatApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const invites = items.filter((request) => request.type === 'DIRECT');
  const openCalls = items.filter((request) => request.type === 'OPEN');

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={DEMO_BEDROOM}
          alt=""
          className="h-40 w-full object-cover md:h-56"
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,oklch(0.18_0.03_155_/_0.8)_0%,oklch(0.18_0.03_155_/_0.3)_78%)]" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
            Designer · Work
          </p>
          <h1 className="mt-2 font-heading text-3xl tracking-tight text-white md:text-4xl">
            Requests
          </h1>
          <p className="mt-2 max-w-lg text-sm text-white/80">
            Direct invites from clients and open calls you can propose on.
          </p>
        </div>
      </section>

      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}

      {loading ? <SkeletonList rows={3} /> : null}

      {!loading && items.length === 0 ? (
        <EmptyState
          title="Nothing to propose on yet"
          description="Publish more portfolios so clients invite you, and check back for open calls."
          actionHref="/designer"
          actionLabel="My portfolios"
        />
      ) : null}

      {invites.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-heading text-2xl tracking-tight">
            Direct invites
          </h2>
          <ul className="space-y-4">
            {invites.map((request) => (
              <RequestRow key={request.id} request={request} />
            ))}
          </ul>
        </section>
      ) : null}

      {openCalls.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-heading text-2xl tracking-tight">Open calls</h2>
          <ul className="space-y-4">
            {openCalls.map((request) => (
              <RequestRow key={request.id} request={request} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
