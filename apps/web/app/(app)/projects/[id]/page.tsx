'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { ReportDialog } from '@/components/features/moderation/report-dialog';
import { MessageThread } from '@/components/features/projects/message-thread';
import { PortfolioShare } from '@/components/features/projects/portfolio-share';
import { PaymentList } from '@/components/features/projects/payment-list';
import { ProjectHistory } from '@/components/features/projects/project-history';
import { StageList } from '@/components/features/projects/stage-list';
import { StageTimeline } from '@/components/features/projects/stage-timeline';
import { WorkLog } from '@/components/features/projects/work-log';
import { ReviewForm } from '@/components/features/reviews/review-form';
import { ReviewList } from '@/components/features/reviews/review-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { Field, Textarea } from '@/components/ui/field';
import { StatusBadge } from '@/components/ui/status-badge';
import { api, errorMessage } from '@/lib/api/client';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/format';
import { useApi } from '@/lib/api/use-api';
import type { Project, ProjectStage } from '@/lib/types';

const tabs = [
  'Stages',
  'Work log',
  'Payments',
  'Messages',
  'History',
  'Review',
] as const;
type Tab = (typeof tabs)[number];

export default function ProjectWorkspacePage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const { user } = useSession();
  const project = useApi<{ project: Project }>(`/projects/${params.id}`);
  const stages = useApi<{ items: ProjectStage[] }>(
    `/projects/${params.id}/stages`,
  );

  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(
    searchParams.has('payment')
      ? 'Payments'
      : searchParams.get('tab') === 'messages'
        ? 'Messages'
        : searchParams.get('tab') === 'work-log'
          ? 'Work log'
          : 'Stages',
  );
  const tabParam = searchParams.get('tab');
  useEffect(() => {
    if (tabParam === 'messages') setTab('Messages');
    if (tabParam === 'work-log') setTab('Work log');
  }, [tabParam]);
  const [reviewed, setReviewed] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const { confirm, dialog } = useConfirm();

  if (project.loading) return <Skeleton className="h-64" />;
  if (project.error || !project.data) {
    return <ErrorNotice message={project.error ?? 'Project not found'} />;
  }

  const item = project.data.project;
  const isClient = user?.id === item.clientId;
  const isDesigner = user?.id === item.designerId;

  async function changeStatus(
    action: 'cancel' | 'on-hold' | 'resume',
    body: { reason?: string } = {},
  ) {
    if (action !== 'cancel') {
      const ok = await confirm(
        action === 'on-hold'
          ? {
              title: 'Put this project on hold?',
              description: `Work pauses until one of you resumes it. The ${isClient ? 'designer' : 'client'} is notified.`,
              confirmLabel: 'Put on hold',
            }
          : {
              title: 'Resume this project?',
              description: `Work continues from the current stage. The ${isClient ? 'designer' : 'client'} is notified.`,
              confirmLabel: 'Resume',
              tone: 'default',
            },
      );
      if (!ok) return;
    }
    setActionError(null);
    setBusy(true);
    try {
      const result = await api.patch<{ refundFailed?: number; refundOffline?: number }>(
        `/projects/${params.id}/${action}`,
        body,
      );
      if (action === 'cancel') {
        setCancelling(false);
        setCancelReason('');
        const notes = [
          result?.refundFailed
            ? `${result.refundFailed} card refund${result.refundFailed === 1 ? '' : 's'} could not be sent`
            : '',
          result?.refundOffline
            ? `${result.refundOffline} payment${result.refundOffline === 1 ? ' was' : 's were'} made offline and will be refunded by the Inside team`
            : '',
        ].filter(Boolean);
        if (notes.length > 0) {
          setActionError(`The project is cancelled. ${notes.join('; ')}. Support will follow up.`);
        }
      }
      await Promise.all([project.reload(), stages.reload()]);
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  const party = isClient ? item.designer : item.client;
  const stageItems = [...(stages.data?.items ?? [])].sort(
    (a, b) => a.stageOrder - b.stageOrder,
  );

  return (
    <div>
      {dialog}
      <Link
        href="/projects"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand"
      >
        <ChevronLeft aria-hidden className="h-4 w-4" />
        All projects
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="brand">Project</Badge>
        <StatusBadge status={item.status} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-title font-semibold">
          {item.title}
        </h1>
        {(isClient || isDesigner) &&
        !['COMPLETED', 'CANCELLED'].includes(item.status) ? (
          <div className="flex flex-wrap items-center gap-2">
            {item.status === 'ACTIVE' ? (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => changeStatus('on-hold')}
              >
                Put on hold
              </Button>
            ) : null}
            {item.status === 'ON_HOLD' ? (
              <Button
                size="sm"
                disabled={busy}
                onClick={() => changeStatus('resume')}
              >
                Resume
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => setCancelling(!cancelling)}
            >
              Cancel project
            </Button>
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-muted">
          {party?.name ? `${isClient ? 'Designer' : 'Client'}: ${party.name} · ` : ''}
          Started {formatDate(item.startedAt)}
          {item.completedAt ? ` · Completed ${formatDate(item.completedAt)}` : ''}
        </p>
        {isClient || isDesigner ? (
          <ReportDialog targetType="PROJECT" targetId={item.id} label="Report a problem" />
        ) : null}
      </div>

      {stageItems.length > 0 ? (
        <StageTimeline
          stages={stageItems}
          currentStage={item.currentStage}
          cancelled={item.status === 'CANCELLED'}
        />
      ) : null}

      <PortfolioShare
        project={item}
        isClient={isClient}
        isDesigner={isDesigner}
        onChanged={() => void project.reload()}
      />

      {actionError ? (
        <div className="mt-6">
          <ErrorNotice message={actionError} />
        </div>
      ) : null}

      {(isClient || isDesigner) &&
      cancelling &&
      item.status !== 'CANCELLED' ? (
        <form
          className="mt-6 flex max-w-xl flex-col gap-3 rounded-card border border-error/30 bg-error/5 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void changeStatus('cancel', { reason: cancelReason.trim() });
          }}
        >
          <Field
            label="Why are you cancelling?"
            htmlFor="cancel-reason"
            hint={`The ${isClient ? 'designer' : 'client'} sees this reason in the project history.`}
          >
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              required
              maxLength={1000}
            />
          </Field>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setCancelling(false)}
            >
              Keep project
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={busy || cancelReason.trim().length < 2}
              className="!bg-error hover:!bg-error/90"
            >
              Confirm cancellation
            </Button>
          </div>
        </form>
      ) : null}

      <div
        role="tablist"
        aria-label="Project sections"
        className="mt-8 flex gap-1 overflow-x-auto border-b border-hairline"
      >
        {tabs.map((name) => (
          <button
            key={name}
            role="tab"
            type="button"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors duration-300',
              tab === name
                ? 'border-brand text-brand'
                : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'Stages' ? (
          stages.loading ? (
            <Skeleton className="h-48" />
          ) : stages.error ? (
            <ErrorNotice message={stages.error} />
          ) : (
            <StageList
              stages={stages.data?.items ?? []}
              isClient={isClient}
              isDesigner={isDesigner}
              active={item.status === 'ACTIVE'}
              onChanged={() => {
                void stages.reload();
                void project.reload();
              }}
              onOpenWorkLog={() => setTab('Work log')}
              cancelled={item.status === 'CANCELLED'}
            />
          )
        ) : null}

        {tab === 'Work log' && user ? (
          <WorkLog
            projectId={params.id}
            currentUserId={user.id}
            partnerName={party?.name ?? 'the other party'}
            active={item.status === 'ACTIVE'}
          />
        ) : null}

        {tab === 'Payments' ? (
          <PaymentList projectId={params.id} isClient={isClient} />
        ) : null}

        {tab === 'Messages' && user ? (
          <MessageThread projectId={params.id} currentUserId={user.id} partner={party} />
        ) : null}

        {tab === 'History' ? <ProjectHistory projectId={params.id} /> : null}

        {tab === 'Review' ? (
          item.status !== 'COMPLETED' ? (
            <EmptyState
              title="Not ready for a review yet."
              description="A review can be left once the project is completed."
            />
          ) : !isClient ? (
            <ReviewList endpoint={`/projects/${item.id}/reviews`} />
          ) : reviewed || item.reviewed ? (
            <EmptyState
              title="Thanks for your review."
              description="It now appears on the designer's profile."
            />
          ) : (
            <ReviewForm
              projectId={params.id}
              onSubmitted={() => setReviewed(true)}
            />
          )
        ) : null}
      </div>
    </div>
  );
}
