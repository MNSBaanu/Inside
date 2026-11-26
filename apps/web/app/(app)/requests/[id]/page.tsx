'use client';

import { ChevronLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { ProposalForm } from '@/components/features/proposals/proposal-form';
import { BriefCard } from '@/components/features/requests/brief-card';
import { PortfolioReferenceCard } from '@/components/features/requests/portfolio-reference';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog, useConfirm } from '@/components/ui/confirm-dialog';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { api, errorMessage } from '@/lib/api/client';
import { formatDate, formatMoney, titleCase } from '@/lib/utils/format';
import { useApi } from '@/lib/api/use-api';
import type { Project, Proposal, ProjectRequest } from '@/lib/types';
import { ProposalComparison } from '@/components/features/proposals/proposal-comparison';

export default function RequestDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const { user } = useSession();
  const router = useRouter();
  const request = useApi<{ request: ProjectRequest }>(`/requests/${params.id}`);
  const proposals = useApi<{ items: Proposal[] }>(
    `/requests/${params.id}/proposals`,
  );

  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmAccept, setConfirmAccept] = useState<Proposal | null>(null);
  const [proposing, setProposing] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('propose') === '1') {
      setProposing(true);
    }
  }, []);
  const { confirm, dialog } = useConfirm();

  if (request.loading) return <Skeleton className="h-64" />;
  if (request.error || !request.data) {
    return <ErrorNotice message={request.error ?? 'Request not found'} />;
  }

  const item = request.data.request;
  const isClient = user?.id === item.clientId;
  const isDesigner = user?.activeRole === 'DESIGNER';
  const designersOnly =
    !isClient && !isDesigner && item.designerId !== user?.id;
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
    const ok = await confirm(
      action === 'close'
        ? {
            title: 'Close to new proposals?',
            description: 'Designers can no longer send proposals. Proposals you already have stay.',
            confirmLabel: 'Close',
          }
        : action === 'cancel'
          ? {
              title: 'Cancel this request?',
              description: 'The request is withdrawn and designers can no longer respond to it.',
              confirmLabel: 'Cancel request',
            }
          : {
              title: 'Decline this request?',
              description: 'The client is told you are not taking it on. This cannot be undone.',
              confirmLabel: 'Decline',
            },
    );
    if (!ok) return;
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
    if (action !== 'accept') {
      const ok = await confirm(
        action === 'reject'
          ? {
              title: 'Reject this proposal?',
              description: 'The designer is told it was not chosen.',
              confirmLabel: 'Reject',
            }
          : {
              title: 'Withdraw your proposal?',
              description: 'The client can no longer accept it.',
              confirmLabel: 'Withdraw',
            },
      );
      if (!ok) return;
    }
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
      {dialog}
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
        <h1 className="font-display text-title font-semibold">
          {item.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {isClient && ['OPEN', 'PENDING'].includes(item.status) ? (
            <>
              {item.type === 'OPEN' && item.status === 'OPEN' ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pendingId === item.id}
                  onClick={() => changeRequest('close')}
                >
                  Close to new proposals
                </Button>
              ) : null}
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
        {item.type === 'DIRECT'
          ? `Direct request${item.designer?.name ? ` to ${item.designer.name}` : ''}`
          : 'Open to proposals'}{' '}
        ·
        Created {formatDate(item.createdAt)}
        {item.budget !== null ? ` · Budget ${formatMoney(item.budget)}` : ''}
        {item.timeline ? ` · Timeline ${item.timeline}` : ''}
      </p>

      {item.portfolio ? (
        <div className="mt-6 max-w-md">
          <PortfolioReferenceCard portfolio={item.portfolio} />
        </div>
      ) : null}

      {item.brief ? (
        <BriefCard
          brief={item.brief}
          clientName={item.client?.name}
          review={
            item.moodboardReview
              ? {
                  requestId: item.id,
                  review: item.moodboardReview,
                  canReview: isDesigner && user?.id === item.designerId,
                  onReviewed: () => void request.reload(),
                }
              : undefined
          }
        />
      ) : null}

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

      {canPropose && proposing ? (
        <Modal
          title={canResubmit ? 'Send a revised proposal' : 'Send a proposal'}
          description="Set out the scope, the timeline, and a fee for each stage."
          onClose={() => setProposing(false)}
        >
          <ProposalForm
            requestId={item.id}
            clientBudget={item.budget}
            onSubmitted={() => {
              setProposing(false);
              void Promise.all([proposals.reload(), request.reload()]);
            }}
          />
        </Modal>
      ) : null}

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {isClient ? 'Proposals received' : 'Proposals'}
          </h2>
          {canPropose ? (
            <Button size="sm" onClick={() => setProposing(true)}>
              <Send aria-hidden className="h-4 w-4" />
              {canResubmit ? 'Send a revised proposal' : 'Send a proposal'}
            </Button>
          ) : null}
        </div>

        <div className="mt-3">
          {designersOnly ? (
            <div className="rounded-xl bg-sand p-4 text-sm">
              <p className="font-semibold">Only designers can send proposals.</p>
              <p className="mt-1 text-muted">
                {user?.role === 'DESIGNER'
                  ? 'Switch to your designer view to send a proposal.'
                  : 'Be a designer on Inside to send proposals on open projects.'}
              </p>
            </div>
          ) : proposals.loading ? (
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
                              onClick={() => setConfirmAccept(proposal)}
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
                !isClient
                  ? 'Be the first to propose on this request.'
                  : item.type === 'DIRECT'
                    ? `${item.designer?.name ?? 'The designer'} will reply here with a proposal.`
                    : 'Designers will respond here. Open requests usually attract more replies.'
              }
            />
          )}
        </div>
      </section>

      {confirmAccept ? (
        <ConfirmDialog
          title="Accept this proposal?"
          description={`This starts the project with ${confirmAccept.designer?.name ?? 'this designer'} for ${formatMoney(confirmAccept.totalAmount)}, paid stage by stage. Other proposals on this request will be declined.`}
          confirmLabel="Accept and start project"
          busy={pendingId === confirmAccept.id}
          onConfirm={() =>
            void act(confirmAccept.id, 'accept').finally(() =>
              setConfirmAccept(null),
            )
          }
          onCancel={() => setConfirmAccept(null)}
        />
      ) : null}
    </div>
  );
}
