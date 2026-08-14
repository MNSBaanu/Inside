'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FolderOpen } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { StatusPill } from '@/components/layout/status-pill';
import { EmptyState } from '@/components/layout/empty-state';
import { InlineAlert } from '@/components/layout/inline-alert';
import { PageHeader } from '@/components/layout/page-header';
import { SkeletonList } from '@/components/layout/skeleton';
import { fetchMe, formatApiError } from '@/lib/api/auth';
import { listProjects } from '@/lib/api/projects';
import type { AuthUser, Project } from '@/lib/api/types';
import { STAGE_LABELS, formatLkr } from '@/lib/stages';
import { cn } from '@/lib/utils';

function progressOf(project: Project) {
  const approved = project.stages.filter(
    (stage) => stage.status === 'APPROVED',
  ).length;
  return `${approved}/${project.stages.length} stages approved`;
}

export function ProjectsList() {
  const [items, setItems] = useState<Project[]>([]);
  const [me, setMe] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [data, user] = await Promise.all([
          listProjects(),
          fetchMe().catch(() => null),
        ]);
        if (cancelled) return;
        setItems(data.items);
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
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace"
        title="Projects"
        description="Every hired project, stage by stage — concepts, approvals, and deliverables in one place."
      />

      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}

      {loading ? <SkeletonList rows={3} /> : null}

      {!loading && items.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="size-5" />}
          title="No projects yet"
          description="A project starts the moment a client accepts a proposal. Post a request or reply to one to get going."
          actionHref="/client/requests"
          actionLabel="View requests"
        />
      ) : null}

      <ul className="space-y-4">
        {items.map((project) => {
          const totalFee = project.stages.reduce(
            (sum, stage) => sum + (stage.fee ?? 0),
            0,
          );
          const canReview =
            project.status === 'COMPLETED' &&
            me?.id === project.clientId &&
            me.activeRole === 'CLIENT';

          return (
            <li key={project.id} className="surface-panel overflow-hidden">
              <Link
                href={`/projects/${project.id}`}
                className="flex flex-wrap items-center justify-between gap-4 p-5 transition-shadow hover:shadow-[0_22px_60px_-32px_oklch(0.22_0.02_145_/_0.55)]"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill value={project.status} />
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {STAGE_LABELS[project.currentStage]}
                    </span>
                  </div>
                  <p className="truncate font-heading text-xl tracking-tight">
                    {project.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {progressOf(project)}
                    {project.designer ? ` · ${project.designer.name}` : ''}
                  </p>
                </div>
                <p className="font-heading text-xl tabular-nums">
                  {formatLkr(totalFee)}
                </p>
              </Link>
              {canReview ? (
                <div className="border-t border-border/60 px-5 py-3">
                  <Link
                    href={`/projects/${project.id}#review`}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                  >
                    Leave a review
                  </Link>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
