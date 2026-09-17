'use client';

import { useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { MessageThread } from '@/components/projects/message-thread';
import { PaymentList } from '@/components/projects/payment-list';
import { StageList } from '@/components/projects/stage-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { api, errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatDate, titleCase } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { Project, ProjectStage } from '@/lib/types';

const tabs = ['Stages', 'Payments', 'Messages'] as const;
type Tab = (typeof tabs)[number];

export default function ProjectWorkspacePage({
  params,
}: {
  params: { id: string };
}) {
  const { user } = useSession();
  const project = useApi<{ project: Project }>(`/projects/${params.id}`);
  const stages = useApi<{ items: ProjectStage[] }>(
    `/projects/${params.id}/stages`,
  );

  const [tab, setTab] = useState<Tab>('Stages');
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (project.loading) return <Skeleton className="h-64" />;
  if (project.error || !project.data) {
    return <ErrorNotice message={project.error ?? 'Project not found'} />;
  }

  const item = project.data.project;
  const isClient = user?.id === item.clientId;
  const isDesigner = user?.id === item.designerId;

  async function changeStatus(action: 'cancel' | 'on-hold' | 'resume') {
    setActionError(null);
    setBusy(true);
    try {
      await api.patch(`/projects/${params.id}/${action}`, {});
      await project.reload();
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Badge tone="brand">Project</Badge>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-section font-semibold">
          {item.title}
        </h1>
        <StatusBadge status={item.status} />
      </div>
      <p className="mt-4 text-muted">
        Current stage: {titleCase(item.currentStage)} · Started{' '}
        {formatDate(item.startedAt)}
        {item.completedAt ? ` · Completed ${formatDate(item.completedAt)}` : ''}
      </p>

      {actionError ? (
        <div className="mt-8">
          <ErrorNotice message={actionError} />
        </div>
      ) : null}

      {isClient && item.status !== 'COMPLETED' ? (
        <div className="mt-8 flex flex-wrap gap-3">
          {item.status === 'ACTIVE' ? (
            <Button
              size="sm"
              variant="outline"
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
          {item.status !== 'CANCELLED' ? (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => changeStatus('cancel')}
            >
              Cancel project
            </Button>
          ) : null}
        </div>
      ) : null}

      <div
        role="tablist"
        aria-label="Project sections"
        className="mt-12 flex gap-2 border-b border-hairline"
      >
        {tabs.map((name) => (
          <button
            key={name}
            role="tab"
            type="button"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
            className={cn(
              '-mb-px border-b-2 px-5 py-3 text-label font-semibold uppercase transition-colors duration-300',
              tab === name
                ? 'border-brand text-brand'
                : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="mt-8">
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
              onChanged={() => {
                void stages.reload();
                void project.reload();
              }}
            />
          )
        ) : null}

        {tab === 'Payments' ? (
          <PaymentList projectId={params.id} isClient={isClient} />
        ) : null}

        {tab === 'Messages' && user ? (
          <MessageThread projectId={params.id} currentUserId={user.id} />
        ) : null}
      </div>
    </div>
  );
}
