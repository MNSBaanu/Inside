import type { ProposalStatus, RequestStatus } from '@/lib/api/types';
import { cn } from '@/lib/utils';

const TONES = {
  neutral: 'border-border/70 bg-muted text-muted-foreground',
  active: 'border-primary/20 bg-primary/10 text-primary',
  positive:
    'border-[oklch(0.82_0.08_150_/_0.6)] bg-[oklch(0.94_0.05_150)] text-[oklch(0.32_0.08_150)]',
  warning: 'border-accent-foreground/15 bg-accent text-accent-foreground',
  muted: 'border-border/60 bg-secondary text-secondary-foreground',
} as const;

const REQUEST_TONES: Record<RequestStatus, keyof typeof TONES> = {
  OPEN: 'active',
  PENDING: 'warning',
  ACCEPTED: 'positive',
  REJECTED: 'neutral',
  CANCELLED: 'neutral',
  CLOSED: 'muted',
};

const PROPOSAL_TONES: Record<ProposalStatus, keyof typeof TONES> = {
  PENDING: 'warning',
  ACCEPTED: 'positive',
  REJECTED: 'neutral',
  WITHDRAWN: 'neutral',
};

function label(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function StatusBadge({
  status,
  kind = 'request',
  className,
}: {
  status: RequestStatus | ProposalStatus;
  kind?: 'request' | 'proposal';
  className?: string;
}) {
  const tone =
    kind === 'request'
      ? REQUEST_TONES[status as RequestStatus]
      : PROPOSAL_TONES[status as ProposalStatus];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider',
        TONES[tone ?? 'neutral'],
        className,
      )}
    >
      {label(status)}
    </span>
  );
}
