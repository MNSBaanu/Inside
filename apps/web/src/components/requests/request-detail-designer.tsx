'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/requests/status-badge';
import { fetchMe, formatApiError } from '@/lib/api/auth';
import {
  createProposal,
  listProposals,
  withdrawProposal,
} from '@/lib/api/proposals';
import { getRequest } from '@/lib/api/requests';
import type {
  AuthUser,
  ProjectRequest,
  Proposal,
  StageName,
} from '@/lib/api/types';
import { STAGE_LABELS, STAGE_ORDER, formatLkr } from '@/lib/stages';
import { cn } from '@/lib/utils';

type FeeMap = Record<StageName, string>;

const EMPTY_FEES: FeeMap = {
  PROPOSAL: '',
  CONCEPT: '',
  DESIGN: '',
  REVISION: '',
  COMPLETION: '',
};

export function RequestDetailDesigner() {
  const params = useParams<{ id: string }>();
  const [request, setRequest] = useState<ProjectRequest | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [scope, setScope] = useState('');
  const [timeline, setTimeline] = useState('');
  const [fees, setFees] = useState<FeeMap>(EMPTY_FEES);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [requestData, me] = await Promise.all([
          getRequest(params.id),
          fetchMe().catch(() => null),
        ]);
        if (cancelled) return;
        setRequest(requestData.request);
        setUser(me);

        const proposalData = await listProposals(params.id).catch(() => null);
        if (cancelled || !proposalData) return;
        setProposals(proposalData.items);

        if (requestData.request.budget) {
          const share = Math.round(
            requestData.request.budget / STAGE_ORDER.length,
          );
          setFees(
            STAGE_ORDER.reduce(
              (acc, stage) => ({ ...acc, [stage]: String(share) }),
              {} as FeeMap,
            ),
          );
        }
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

  const total = useMemo(
    () =>
      STAGE_ORDER.reduce((sum, stage) => sum + (Number(fees[stage]) || 0), 0),
    [fees],
  );

  const myProposal = proposals.find((p) => p.designerId === user?.id) ?? null;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (scope.trim().length < 2) {
      setError('Describe the scope of work.');
      return;
    }
    if (timeline.trim().length < 2) {
      setError('Add a timeline, for example "6 weeks".');
      return;
    }
    if (total <= 0) {
      setError('Add a fee for at least one stage.');
      return;
    }
    setPending(true);
    try {
      const data = await createProposal(params.id, {
        scope: scope.trim(),
        timeline: timeline.trim(),
        stageFees: STAGE_ORDER.map((stage) => ({
          name: stage,
          fee: Number(fees[stage]) || 0,
        })),
      });
      setProposals((prev) => [data.proposal, ...prev]);
      setMessage('Proposal submitted.');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setPending(false);
    }
  }

  async function onWithdraw(id: string) {
    setPending(true);
    setError(null);
    try {
      const data = await withdrawProposal(id);
      setProposals((prev) =>
        prev.map((p) => (p.id === id ? data.proposal : p)),
      );
      setMessage('Proposal withdrawn.');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading request…</p>;
  }

  if (!request) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive" role="alert">
          {error ?? 'Request not found.'}
        </p>
        <Link
          href="/designer/requests"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Back to requests
        </Link>
      </div>
    );
  }

  const canPropose =
    !myProposal ||
    myProposal.status === 'WITHDRAWN' ||
    myProposal.status === 'REJECTED';
  const acceptsProposals =
    request.type === 'OPEN'
      ? request.status === 'OPEN'
      : request.status === 'PENDING';

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/designer/requests"
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
          {request.client ? `${request.client.name} · ` : ''}
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

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-primary" role="status">
          {message}
        </p>
      ) : null}

      {myProposal ? (
        <section className="surface-panel space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-xl tracking-tight">
              Your proposal
            </h2>
            <StatusBadge status={myProposal.status} kind="proposal" />
          </div>
          <p className="text-sm text-muted-foreground">
            {myProposal.timeline} · {formatLkr(myProposal.totalAmount)}
          </p>
          <p className="text-sm leading-relaxed text-foreground/90">
            {myProposal.scope}
          </p>
          {myProposal.status === 'PENDING' ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onWithdraw(myProposal.id)}
            >
              Withdraw
            </Button>
          ) : null}
        </section>
      ) : null}

      {!acceptsProposals ? (
        <p className="text-sm text-muted-foreground">
          This request is no longer accepting proposals.
        </p>
      ) : canPropose ? (
        <form onSubmit={onSubmit} className="surface-panel space-y-5 p-5">
          <h2 className="font-heading text-xl tracking-tight">
            Submit a proposal
          </h2>

          <div className="space-y-2">
            <Label htmlFor="scope">Scope of work</Label>
            <textarea
              id="scope"
              rows={4}
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder="Space planning, joinery drawings, lighting plan, two revision rounds…"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeline">Timeline</Label>
            <Input
              id="timeline"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              placeholder="6 weeks"
            />
          </div>

          <div className="space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Stage fees (LKR)
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {STAGE_ORDER.map((stage) => (
                <div key={stage} className="space-y-2">
                  <Label htmlFor={`fee-${stage}`}>{STAGE_LABELS[stage]}</Label>
                  <Input
                    id={`fee-${stage}`}
                    type="number"
                    min={0}
                    value={fees[stage]}
                    onChange={(e) =>
                      setFees((prev) => ({ ...prev, [stage]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Total{' '}
              <span className="font-medium tabular-nums text-foreground">
                {formatLkr(total)}
              </span>
              {request.budget != null && total > request.budget
                ? ' · above the client budget'
                : ''}
            </p>
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? 'Submitting…' : 'Submit proposal'}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
