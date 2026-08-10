'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { StatusPill } from '@/components/layout/status-pill';
import { ModeSwitchNotice } from '@/components/projects/mode-switch-notice';
import { PaymentsSummary } from '@/components/projects/payments-summary';
import { ProjectChat } from '@/components/projects/project-chat';
import { ProjectReviewSection } from '@/components/projects/project-review-section';
import { StagePanel } from '@/components/projects/stage-panel';
import { StageTimeline } from '@/components/projects/stage-timeline';
import { fetchMe, formatApiError } from '@/lib/api/auth';
import {
  listPayments,
  payPayment,
  releasePayment,
} from '@/lib/api/payments';
import {
  cancelProject,
  getProject,
  holdProject,
  resumeProject,
} from '@/lib/api/projects';
import type { AuthUser, MilestonePayment, Project } from '@/lib/api/types';
import { STAGE_LABELS, formatLkr } from '@/lib/stages';
import { cn } from '@/lib/utils';

export function ProjectWorkspace() {
  const params = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [payments, setPayments] = useState<MilestonePayment[]>([]);
  const [me, setMe] = useState<AuthUser | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshProject = useCallback(async () => {
    const [projectData, paymentData] = await Promise.all([
      getProject(params.id),
      listPayments(params.id),
    ]);
    setProject(projectData.project);
    setPayments(paymentData.items);
  }, [params.id]);

  const refreshMe = useCallback(async () => {
    const user = await fetchMe();
    setMe(user);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [projectData, paymentData, user] = await Promise.all([
          getProject(params.id),
          listPayments(params.id),
          fetchMe(),
        ]);
        if (cancelled) return;
        setProject(projectData.project);
        setPayments(paymentData.items);
        setMe(user);
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

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading project…</p>;
  }

  if (!project) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive" role="alert">
          {error ?? 'Project not found.'}
        </p>
        <Link
          href="/projects"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Back to projects
        </Link>
      </div>
    );
  }

  const stages = [...project.stages].sort((a, b) => a.stageOrder - b.stageOrder);
  const selected =
    stages.find((stage) => stage.id === selectedId) ??
    stages.find((stage) => stage.name === project.currentStage) ??
    stages[0];

  const isDesigner = me?.id === project.designerId;
  const isClient = me?.id === project.clientId;
  const role = isDesigner ? 'designer' : isClient ? 'client' : 'viewer';
  const neededMode = isDesigner ? 'DESIGNER' : isClient ? 'CLIENT' : null;
  const wrongMode = Boolean(neededMode && me?.activeRole !== neededMode);
  const projectActive = project.status === 'ACTIVE';
  const canAct = projectActive && !wrongMode && role !== 'viewer';
  const counterparty = isDesigner ? project.client : project.designer;
  const totalFee = stages.reduce((sum, stage) => sum + (stage.fee ?? 0), 0);

  async function runProjectAction(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await refreshProject();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/projects"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← All projects
        </Link>
      </div>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill value={project.status} />
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Current stage · {STAGE_LABELS[project.currentStage]}
          </span>
        </div>
        <h1 className="font-heading text-3xl tracking-tight md:text-4xl">
          {project.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {counterparty ? `${isDesigner ? 'Client' : 'Designer'}: ${counterparty.name} · ` : ''}
          {formatLkr(totalFee)} across {stages.length} stages
          {project.startedAt
            ? ` · started ${new Date(project.startedAt).toLocaleDateString()}`
            : ''}
        </p>

        {role !== 'viewer' ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {project.status === 'ACTIVE' ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => runProjectAction(() => holdProject(project.id))}
              >
                Put on hold
              </Button>
            ) : null}
            {project.status === 'ON_HOLD' ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => runProjectAction(() => resumeProject(project.id))}
              >
                Resume
              </Button>
            ) : null}
            {project.status === 'ACTIVE' || project.status === 'ON_HOLD' ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => {
                  if (!window.confirm('Cancel this project? This cannot be undone.')) {
                    return;
                  }
                  void runProjectAction(() => cancelProject(project.id));
                }}
              >
                Cancel project
              </Button>
            ) : null}
          </div>
        ) : null}
      </header>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {wrongMode && neededMode ? (
        <ModeSwitchNotice
          need={neededMode}
          onSwitched={async () => {
            await refreshMe();
            await refreshProject();
          }}
        />
      ) : null}

      <StageTimeline
        stages={stages}
        selectedId={selected.id}
        currentStage={project.currentStage}
        onSelect={setSelectedId}
      />

      <StagePanel
        key={selected.id}
        stage={selected}
        role={role}
        canAct={canAct}
        isCurrent={selected.name === project.currentStage}
        projectActive={projectActive}
        payment={
          payments.find((payment) => payment.stageId === selected.id) ?? null
        }
        onChanged={refreshProject}
      />

      {me ? (
        <ProjectChat
          projectId={project.id}
          meId={me.id}
          counterpartyName={counterparty?.name ?? 'the other party'}
        />
      ) : null}

      {me && isClient && project.status === 'COMPLETED' ? (
        <ProjectReviewSection
          projectId={project.id}
          designerId={project.designerId}
          designerName={project.designer?.name ?? 'your designer'}
          me={me}
          onUserRefresh={refreshMe}
        />
      ) : null}

      <PaymentsSummary
        payments={payments}
        stages={stages}
        isClient={isClient}
        busy={busy}
        onPay={(id) => void runProjectAction(() => payPayment(id))}
        onRelease={(id) => void runProjectAction(() => releasePayment(id))}
      />
    </div>
  );
}
