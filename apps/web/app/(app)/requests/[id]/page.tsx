'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { ProposalForm } from '@/components/proposals/proposal-form';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { api, errorMessage } from '@/lib/api';
import { formatDate, formatMoney, titleCase } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { Project, Proposal, ProjectRequest } from '@/lib/types';

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
  const canPropose =
    isDesigner &&
    !myProposal &&
    ['OPEN', 'PENDING'].includes(item.status) &&
    (item.type === 'OPEN' || item.designerId === user?.id);

  async function changeRequest(action: 'cancel' | 'close') {
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
      <Badge tone="brand">Request</Badge>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-section font-semibold">
          {item.title}
        </h1>
        <StatusBadge status={item.status} />
      </div>
      <p className="mt-4 text-muted">
        {item.type === 'DIRECT' ? 'Direct request' : 'Open to proposals'} ·
        Created {formatDate(item.createdAt)}
        {item.budget !== null ? ` · Budget ${formatMoney(item.budget)}` : ''}
      </p>

      {isClient && ['OPEN', 'PENDING'].includes(item.status) ? (
        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            size="sm"
            variant="outline"
            disabled={pendingId === item.id}
            onClick={() => changeRequest('cancel')}
          >
            Cancel request
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={pendingId === item.id}
            onClick={() => changeRequest('close')}
          >
            Close to new proposals
          </Button>
        </div>
      ) : null}

      {item.description ? (
        <Card className="mt-10">
          <p className="label text-muted">Description</p>
          <p className="mt-3 whitespace-pre-line text-muted">
            {item.description}
          </p>
        </Card>
      ) : null}

      {actionError ? (
        <div className="mt-8">
          <ErrorNotice message={actionError} />
        </div>
      ) : null}

      {canPropose ? (
        <Card className="mt-12">
          <CardHeader
            title="Send a proposal"
            description="Set out the scope, the timeline, and a fee for each stage."
          />
          <ProposalForm
            requestId={item.id}
            onSubmitted={() => {
              void proposals.reload();
            }}
          />
        </Card>
      ) : null}

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold">
          {isClient ? 'Proposals received' : 'Proposals'}
        </h2>

        <div className="mt-8">
          {proposals.loading ? (
            <Skeleton className="h-40" />
          ) : proposals.error ? (
            <ErrorNotice message={proposals.error} />
          ) : proposals.data && proposals.data.items.length > 0 ? (
            <ul className="flex flex-col gap-6">
              {proposals.data.items.map((proposal) => (
                <li key={proposal.id}>
                  <Card>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar
                          name={proposal.designer?.name ?? 'Designer'}
                          src={proposal.designer?.avatarUrl}
                          size={48}
                        />
                        <div>
                          <p className="font-display text-xl font-semibold">
                            {proposal.designer?.name ?? 'Designer'}
                          </p>
                          <p className="text-sm text-muted">
                            Submitted {formatDate(proposal.submittedAt)}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={proposal.status} />
                    </div>

                    <p className="mt-6 whitespace-pre-line text-muted">
                      {proposal.scope}
                    </p>

                    <dl className="mt-6 flex flex-wrap gap-8">
                      <div>
                        <dt className="label text-muted">Timeline</dt>
                        <dd className="mt-2 text-lg">{proposal.timeline}</dd>
                      </div>
                      <div>
                        <dt className="label text-muted">Total</dt>
                        <dd className="mt-2 font-display text-2xl font-semibold text-brand">
                          {formatMoney(proposal.totalAmount)}
                        </dd>
                      </div>
                    </dl>

                    {proposal.stageFees.length > 0 ? (
                      <ul className="mt-6 flex flex-wrap gap-2">
                        {proposal.stageFees.map((stage) => (
                          <li key={stage.name}>
                            <Badge>
                              {titleCase(stage.name)} — {formatMoney(stage.fee)}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {proposal.status === 'PENDING' ? (
                      <div className="mt-8 flex flex-wrap gap-4">
                        {isClient ? (
                          <>
                            <Button
                              size="lg"
                              disabled={pendingId === proposal.id}
                              onClick={() => act(proposal.id, 'accept')}
                            >
                              {pendingId === proposal.id
                                ? 'Working…'
                                : 'Accept proposal'}
                            </Button>
                            <Button
                              size="lg"
                              variant="outline"
                              disabled={pendingId === proposal.id}
                              onClick={() => act(proposal.id, 'reject')}
                            >
                              Reject
                            </Button>
                          </>
                        ) : proposal.designerId === user?.id ? (
                          <Button
                            size="lg"
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
