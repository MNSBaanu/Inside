'use client';

import { StatusPill } from '@/components/layout/status-pill';
import type { ProjectStage } from '@/lib/api/types';
import { STAGE_LABELS, formatLkr } from '@/lib/stages';
import { cn } from '@/lib/utils';

export function StageTimeline({
  stages,
  selectedId,
  currentStage,
  onSelect,
}: {
  stages: ProjectStage[];
  selectedId: string;
  currentStage: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ol className="grid gap-3 md:grid-cols-5">
      {stages.map((stage) => {
        const selected = stage.id === selectedId;
        const isCurrent = stage.name === currentStage;
        return (
          <li key={stage.id}>
            <button
              type="button"
              onClick={() => onSelect(stage.id)}
              aria-current={selected ? 'step' : undefined}
              className={cn(
                'w-full space-y-2 rounded-2xl border p-4 text-left outline-none transition-all focus-visible:ring-3 focus-visible:ring-ring/40',
                selected
                  ? 'border-primary/50 bg-primary/[0.06] shadow-[0_18px_44px_-30px_oklch(0.22_0.02_145_/_0.6)]'
                  : 'border-border/60 bg-background/40 hover:-translate-y-0.5 hover:border-primary/30',
              )}
            >
              <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Stage {stage.stageOrder}
                {isCurrent ? (
                  <span className="inline-flex items-center gap-1 text-primary">
                    <span
                      aria-hidden="true"
                      className="size-1.5 rounded-full bg-primary"
                    />
                    Current
                  </span>
                ) : null}
              </p>
              <p className="font-heading text-lg tracking-tight">
                {STAGE_LABELS[stage.name]}
              </p>
              <StatusPill value={stage.status} />
              <p className="text-sm tabular-nums text-muted-foreground">
                {formatLkr(stage.fee)}
              </p>
              {stage.dueDate ? (
                <p className="text-[11px] text-muted-foreground">
                  Due {new Date(stage.dueDate).toLocaleDateString()}
                </p>
              ) : null}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
