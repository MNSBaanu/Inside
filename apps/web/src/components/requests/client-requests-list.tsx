'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/layout/empty-state';
import { StatusBadge } from '@/components/requests/status-badge';
import { formatApiError } from '@/lib/api/auth';
import { cancelRequest, closeRequest, listRequests } from '@/lib/api/requests';
import type { ProjectRequest } from '@/lib/api/types';
import { DEMO_KITCHEN } from '@/lib/media';
import { formatLkr } from '@/lib/stages';
import { cn } from '@/lib/utils';

export function ClientRequestsList() {
  const [items, setItems] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listRequests();
      setItems(data.items);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCancel(id: string) {
    if (!window.confirm('Cancel this request?')) return;
    setBusyId(id);
    setError(null);
    try {
      const data = await cancelRequest(id);
      setItems((prev) => prev.map((r) => (r.id === id ? data.request : r)));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function onClose(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const data = await closeRequest(id);
      setItems((prev) => prev.map((r) => (r.id === id ? data.request : r)));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={DEMO_KITCHEN}
          alt=""
          className="h-40 w-full object-cover md:h-56"
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,oklch(0.18_0.03_155_/_0.8)_0%,oklch(0.18_0.03_155_/_0.3)_78%)]" />
        <div className="absolute inset-0 flex flex-col justify-end gap-4 p-6 md:flex-row md:items-end md:justify-between md:p-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
              Client · Hiring
            </p>
            <h1 className="mt-2 font-heading text-3xl tracking-tight text-white md:text-4xl">
              Requests
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/80">
              Post an open request for proposals, or invite a designer directly.
            </p>
          </div>
          <Link
            href="/client/requests/new"
            className={cn(
              buttonVariants(),
              'bg-white text-[oklch(0.24_0.03_155)] hover:bg-white/90',
            )}
          >
            New request
          </Link>
        </div>
      </section>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading requests…</p>
      ) : null}

      {!loading && items.length === 0 ? (
        <EmptyState
          title="No requests yet"
          description="Post an open request so designers can send proposals, or invite one designer directly."
          actionHref="/client/requests/new"
          actionLabel="New request"
        />
      ) : null}

      <ul className="space-y-4">
        {items.map((request) => (
          <li key={request.id} className="surface-panel space-y-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={request.status} />
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {request.type === 'OPEN' ? 'Open call' : 'Direct invite'}
                  </span>
                </div>
                <Link
                  href={`/client/requests/${request.id}`}
                  className="block font-heading text-xl tracking-tight hover:underline"
                >
                  {request.title}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {request.designer
                    ? `${request.designer.name} · `
                    : ''}
                  {request.proposalCount}{' '}
                  {request.proposalCount === 1 ? 'proposal' : 'proposals'}
                  {request.budget != null
                    ? ` · ${formatLkr(request.budget)}`
                    : ''}
                  {request.brief
                    ? ` · ${request.brief.styles.slice(0, 2).join(', ')}`
                    : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/client/requests/${request.id}`}
                  className={cn(buttonVariants({ size: 'sm' }))}
                >
                  {request.proposalCount > 0 ? 'Compare proposals' : 'Open'}
                </Link>
                {request.type === 'OPEN' && request.status === 'OPEN' ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busyId === request.id}
                    onClick={() => onClose(request.id)}
                  >
                    Close
                  </Button>
                ) : null}
                {request.status !== 'ACCEPTED' &&
                request.status !== 'CANCELLED' &&
                request.status !== 'CLOSED' ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busyId === request.id}
                    onClick={() => onCancel(request.id)}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>
            {request.description ? (
              <p className="line-clamp-2 text-sm leading-relaxed text-foreground/85">
                {request.description}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
