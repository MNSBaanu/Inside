import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatDate, formatMoney, titleCase } from '@/lib/utils/format';
import type { ProjectStage, StageName, StageStatus } from '@/lib/types';

const statusLabel: Record<StageStatus, string> = {
  PENDING: 'Not started',
  IN_PROGRESS: 'In progress',
  SUBMITTED: 'Awaiting approval',
  APPROVED: 'Approved',
  REJECTED: 'Changes requested',
};

const statusTone: Record<StageStatus, string> = {
  PENDING: 'bg-sand text-muted',
  IN_PROGRESS: 'bg-status-progress-soft text-status-progress',
  SUBMITTED: 'bg-status-action-soft text-status-action',
  APPROVED: 'bg-brand-soft text-brand-deep',
  REJECTED: 'bg-status-problem-soft text-status-problem',
};

export function StageTimeline({
  stages,
  currentStage,
}: {
  stages: ProjectStage[];
  currentStage: StageName;
}) {
  const approved = stages.filter((stage) => stage.status === 'APPROVED').length;

  return (
    <section aria-label="Project stages" className="mt-6">
      <div className="flex items-center justify-between text-sm">
        <span>
          <span className="text-muted">Current stage </span>
          <span className="font-semibold">{titleCase(currentStage)}</span>
        </span>
        <span className="text-muted">
          {approved} of {stages.length} approved
        </span>
      </div>

      <ol className="mt-4 flex overflow-x-auto pb-2 [scrollbar-width:thin]">
        {stages.map((stage, index) => {
          const done = stage.status === 'APPROVED';
          const current = stage.name === currentStage && !done;
          const rejected = stage.status === 'REJECTED';
          const date = stage.approvedAt ?? stage.submittedAt ?? stage.dueDate;

          return (
            <li key={stage.id} className="relative min-w-[9.5rem] flex-1 pr-3">
              {index < stages.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    'absolute left-9 right-0 top-[1.0625rem] h-0.5',
                    done ? 'bg-brand' : 'bg-hairline',
                  )}
                />
              ) : null}
              <span
                aria-hidden
                className={cn(
                  'relative z-10 grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-semibold',
                  done && 'border-brand bg-brand text-canvas',
                  current && !rejected && 'border-brand bg-canvas text-brand ring-4 ring-brand-soft',
                  rejected && 'border-status-problem bg-canvas text-status-problem',
                  !done && !current && !rejected && 'border-hairline bg-canvas text-muted',
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" />
                ) : rejected ? (
                  <X className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </span>
              <p className={cn('mt-3 text-sm', current ? 'font-semibold text-ink' : 'font-medium')}>
                {titleCase(stage.name)}
              </p>
              <span
                className={cn(
                  'mt-1.5 inline-flex rounded-pill px-2 py-0.5 text-xs font-semibold',
                  statusTone[stage.status],
                )}
              >
                {statusLabel[stage.status]}
              </span>
              <p className="mt-1.5 text-xs text-muted">
                {stage.fee !== null ? formatMoney(stage.fee) : null}
                {stage.fee !== null && date ? ' · ' : null}
                {date ? formatDate(date) : null}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
