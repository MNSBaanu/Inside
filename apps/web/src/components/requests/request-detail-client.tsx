'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/layout/empty-state';
import { InlineAlert } from '@/components/layout/inline-alert';
import { Skeleton, SkeletonList } from '@/components/layout/skeleton';
import { StatusBadge } from '@/components/requests/status-badge';
import { formatApiError } from '@/lib/api/auth';
import {
  acceptProposal,
  listProposals,
  rejectProposal,
} from '@/lib/api/proposals';
import { getRequest } from '@/lib/api/requests';
import type { Project, ProjectRequest, Proposal } from '@/lib/api/types';
import { STAGE_LABELS, STAGE_ORDER, formatLkr } from '@/lib/stages';
import { cn } from '@/lib/utils';

function initialsOf(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function RequestDetailClient() {
  const params = useParams<{ id: string }>();
  const [request, setRequest] = useState<ProjectRequest | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [requestData, proposalData] = await Promise.all([
          getRequest(params.id),
          listProposals(params.id).catch(() => ({ items: [] as Proposal[] })),
        ]);
        if (cancelled) return;
        setRequest(requestData.request);
        setProposals(proposalData.items);
      } catch (err) {
        if (!cancelled) setError(formatApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function onAccept(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const data = await acceptProposal(id);
      setProject(data.project);
      const [requestData, proposalData] = await Promise.all([
        getRequest(params.id),
        listProposals(params.id),
      ]);
      setRequest(requestData.request);
      setProposals(proposalData.items);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function onReject(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const data = await rejectProposal(id);
      setProposals((prev) =>
        prev.map((p) => (p.id === id ? data.proposal : p)),
      );
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-2/3" />
        <SkeletonList rows={2} />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="space-y-3">
        <InlineAlert tone="error">
          {error ?? 'Request not found.'}
        </InlineAlert>
        <Link
          href="/client/requests"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Back to requests
        </Link>
      </div>
    );
  }

  const pending = proposals.filter((p) => p.status === 'PENDING');
  const decided = proposals.filter((p) => p.status !== 'PENDING');
  const canDecide = request.status === 'OPEN' || request.status === 'PENDING';

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/client/requests"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← All requests
        </Link>
      </div>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={request.status} />
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {request.type === 'OPEN' ? 'Open call' : 'Direct invite'}
          </span>
        </div>
        <h1 className="font-heading text-3xl tracking-tight md:text-4xl">
          {request.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {request.designer ? `Invited ${request.designer.name} · ` : ''}
          {formatLkr(request.budget)} budget
          {request.brief
            ? ` · ${request.brief.styles.join(', ')} · ${request.brief.rooms.join(', ')}`
            : ''}
        </p>
        {request.description ? (
          <p className="max-w-2xl leading-relaxed text-foreground/90">
            {request.description}
          </p>
        ) : null}
      </header>

      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}

      {project ? (
        <section className="surface-panel space-y-3 p-5 md:p-6">
          <h2 className="font-heading text-xl tracking-tight">
            Project created
          </h2>
          <p className="text-sm text-muted-foreground">
            {project.title} · current stage {STAGE_LABELS[project.currentStage]}
          </p>
          <ol className="grid gap-2 sm:grid-cols-5">
            {project.stages.map((stage) => (
              <li
                key={stage.id}
                className="rounded-xl border border-border/60 p-3 text-center"
              >
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {STAGE_LABELS[stage.name]}
                </p>
                <p className="mt-1 text-sm font-medium">
                  {formatLkr(stage.fee)}
                </p>
              </li>
            ))}
          </ol>
          <Link
            href={`/projects/${project.id}`}
            className={cn(buttonVariants({ size: 'sm' }))}
          >
            Open workspace
          </Link>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-heading text-2xl tracking-tight">
          Proposals ({proposals.length})
        </h2>

        {proposals.length === 0 ? (
          <EmptyState
            title="No proposals yet"
            description={
              request.type === 'OPEN'
                ? 'Designers can see this open request and will reply with scope, timeline, and fees.'
                : 'The invited designer has not replied yet.'
            }
          />
        ) : null}

        {pending.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {pending.map((proposal) => (
              <article
                key={proposal.id}
                className="surface-panel flex flex-col gap-4 p-5"
              >
                <div className="flex items-center gap-3">
                  {proposal.designer?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={proposal.designer.avatarUrl}
                      alt=""
                      className="size-11 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground">
                      {initialsOf(proposal.designer?.name ?? '?')}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-heading text-lg tracking-tight">
                      {proposal.designer?.name ?? 'Designer'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {proposal.timeline}
                      {proposal.designer?.isVerified ? ' · Verified' : ''}
                    </p>
                  </div>
                  <p className="ml-auto font-heading text-xl tabular-nums">
                    {formatLkr(proposal.totalAmount)}
                  </p>
                </div>

                <p className="line-clamp-4 text-sm leading-relaxed text-foreground/90">
                  {proposal.scope}
                </p>

                <dl className="space-y-1.5 border-t border-border/60 pt-3 text-sm">
                  {STAGE_ORDER.map((stage) => {
                    const fee = proposal.stageFees?.find(
                      (item) => item.name === stage,
                    )?.fee;
                    return (
                      <div key={stage} className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">
                          {STAGE_LABELS[stage]}
                        </dt>
                        <dd className="tabular-nums">{formatLkr(fee ?? null)}</dd>
                      </div>
                    );
                  })}
                </dl>

                {canDecide ? (
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={busyId === proposal.id}
                      onClick={() => onAccept(proposal.id)}
                    >
                      {busyId === proposal.id ? 'Working…' : 'Accept & start'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={busyId === proposal.id}
                      onClick={() => onReject(proposal.id)}
                    >
                      Reject
                    </Button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}

        {decided.length > 0 ? (
          <ul className="space-y-3">
            {decided.map((proposal) => (
              <li
                key={proposal.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={proposal.status} kind="proposal" />
                  <span className="text-sm">
                    {proposal.designer?.name ?? 'Designer'}
                  </span>
                </div>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {formatLkr(proposal.totalAmount)} · {proposal.timeline}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
