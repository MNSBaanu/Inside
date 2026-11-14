'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { ProposalForm } from '@/components/features/proposals/proposal-form';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { api, errorMessage } from '@/lib/api/client';
import { formatDate, formatMoney, titleCase } from '@/lib/utils/format';
import { useApi } from '@/lib/api/use-api';
import type { Project, Proposal, ProjectRequest } from '@/lib/types';
import { ProposalComparison } from '@/components/features/proposals/proposal-comparison';

export default function RequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { user } = useSession();
  const router = useRouter();
  const request = useApi<{ request: ProjectRequest }>(`/requests/${params.id}`);
  const proposals = useApi<{ items: Proposal[] }>(
    `/requests/${params.id}/proposals`,
  );

  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (request.loading) return <Skeleton className="h-64" />;
  if (request.error || !request.data) {
    return <ErrorNotice message={request.error ?? 'Request not found'} />;
  }

  const item = request.data.request;
  const isClient = user?.id === item.clientId;
  const isDesigner = user?.activeRole === 'DESIGNER';
  const myProposal = proposals.data?.items.find(
    (proposal) => proposal.designerId === user?.id,
  );
  const comparable =
    proposals.data?.items.filter((proposal) => proposal.status === 'PENDING') ??
    [];
  const canResubmit =
    myProposal?.status === 'WITHDRAWN' || myProposal?.status === 'REJECTED';
  const canPropose =
    isDesigner &&
    (!myProposal || canResubmit) &&
    ['OPEN', 'PENDING'].includes(item.status) &&
    (item.type === 'OPEN' || item.designerId === user?.id);

  async function changeRequest(action: 'cancel' | 'close' | 'decline') {
    setActionError(null);
    setPendingId(item.id);
    try {
      await api.patch(`/requests/${item.id}/${action}`, {});
      await request.reload();
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setPendingId(null);
    }
  }

  async function act(
    proposalId: string,
    action: 'accept' | 'reject' | 'withdraw',
  ) {
    setActionError(null);
    setPendingId(proposalId);
    try {
      if (action === 'accept') {
        const data = await api.patch<{ project: Project }>(
          `/proposals/${proposalId}/accept`,
        );
        router.push(`/projects/${data.project.id}`);
        return;
      }
      await api.patch(`/proposals/${proposalId}/${action}`);
      await Promise.all([proposals.reload(), request.reload()]);
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div>
      <Link
        href="/requests"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand"
      >
        <ChevronLeft aria-hidden className="h-4 w-4" />
        All requests
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="brand">Request</Badge>
        <StatusBadge status={item.status} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold md:text-4xl">
          {item.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {isClient && ['OPEN', 'PENDING'].includes(item.status) ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                disabled={pendingId === item.id}
                onClick={() => changeRequest('close')}
              >
                Close to new proposals
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pendingId === item.id}
                onClick={() => changeRequest('cancel')}
              >
                Cancel request
              </Button>
            </>
          ) : null}
          {isDesigner &&
          item.type === 'DIRECT' &&
          item.designerId === user?.id &&
          item.status === 'PENDING' ? (
            <Button
              size="sm"
              variant="outline"
              disabled={pendingId === item.id}
              onClick={() => changeRequest('decline')}
            >
              Decline request
            </Button>
          ) : null}
        </div>
      </div>
      <p className="mt-2 text-sm text-muted">
        {item.type === 'DIRECT' ? 'Direct request' : 'Open to proposals'} ·
        Created {formatDate(item.createdAt)}
        {item.budget !== null ? ` · Budget ${formatMoney(item.budget)}` : ''}
        {item.timeline ? ` · Timeline ${item.timeline}` : ''}
      </p>

      {item.description ? (
        <Card className="mt-6">
          <p className="ui-label text-muted">Description</p>
          <p className="mt-2 whitespace-pre-line text-muted">
            {item.description}
          </p>
        </Card>
      ) : null}

      {actionError ? (
        <div className="mt-6">
          <ErrorNotice message={actionError} />
        </div>
      ) : null}

      {canPropose ? (
        <Card className="mt-6">
          <CardHeader
            title={canResubmit ? 'Send a revised proposal' : 'Send a proposal'}
            description="Set out the scope, the timeline, and a fee for each stage."
          />
          <ProposalForm
            requestId={item.id}
            onSubmitted={() => {
              void Promise.all([proposals.reload(), request.reload()]);
            }}
          />
        </Card>
      ) : null}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">
          {isClient ? 'Proposals received' : 'Proposals'}
        </h2>

        <div className="mt-3">
          {proposals.loading ? (
            <Skeleton className="h-40" />
          ) : proposals.error ? (
            <ErrorNotice message={proposals.error} />
          ) : proposals.data && proposals.data.items.length > 0 ? (
            <>
            {isClient && comparable.length >= 2 ? (
              <div className="mb-4">
                <ProposalComparison proposals={comparable} />
              </div>
            ) : null}
            <ul className="flex flex-col gap-3">
              {proposals.data.items.map((proposal) => (
                <li key={proposal.id}>
                  <Card>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar
                          name={proposal.designer?.name ?? 'Designer'}
                          src={proposal.designer?.avatarUrl}
                          size={40}
                        />
                        <div>
                          <p className="font-semibold">
                            {proposal.designer?.name ?? 'Designer'}
                          </p>
                          <p className="text-sm text-muted">
                            Submitted {formatDate(proposal.submittedAt)}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={proposal.status} />
                    </div>

                    <p className="mt-4 whitespace-pre-line text-sm text-muted">
                      {proposal.scope}
                    </p>

                    <dl className="mt-4 flex flex-wrap gap-8">
                      <div>
                        <dt className="ui-label text-muted">Timeline</dt>
                        <dd className="mt-1">{proposal.timeline}</dd>
                      </div>
                      <div>
                        <dt className="ui-label text-muted">Total</dt>
                        <dd className="mt-1 text-xl font-semibold text-brand">
                          {formatMoney(proposal.totalAmount)}
                        </dd>
                      </div>
                    </dl>

                    {proposal.stageFees.length > 0 ? (
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {proposal.stageFees.map((stage) => (
                          <li key={stage.name}>
                            <Badge>
                              {titleCase(stage.name)} - {formatMoney(stage.fee)}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {proposal.status === 'PENDING' ? (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {isClient ? (
                          <>
                            <Button
                              size="sm"
                              disabled={pendingId === proposal.id}
                              onClick={() => act(proposal.id, 'accept')}
                            >
                              {pendingId === proposal.id
                                ? 'Working…'
                                : 'Accept proposal'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pendingId === proposal.id}
                              onClick={() => act(proposal.id, 'reject')}
                            >
                              Reject
                            </Button>
                          </>
                        ) : proposal.designerId === user?.id ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pendingId === proposal.id}
                            onClick={() => act(proposal.id, 'withdraw')}
                          >
                            Withdraw
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </Card>
                </li>
              ))}
            </ul>
            </>
          ) : (
            <EmptyState
              title="No proposals yet."
              description={
                isClient
                  ? 'Designers will respond here. Open requests usually attract more replies.'
                  : 'Be the first to propose on this request.'
              }
            />
          )}
        </div>
      </section>
    </div>
  );
}
