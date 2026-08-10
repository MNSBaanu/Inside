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
                'w-full space-y-2 rounded-2xl border p-4 text-left transition-colors',
                selected
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-border/60 bg-background/40 hover:border-primary/30',
              )}
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Stage {stage.stageOrder}
                {isCurrent ? ' · Current' : ''}
              </p>
              <p className="font-heading text-lg tracking-tight">
                {STAGE_LABELS[stage.name]}
              </p>
              <StatusPill value={stage.status} />
              <p className="text-sm tabular-nums text-muted-foreground">
                {formatLkr(stage.fee)}
              </p>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
