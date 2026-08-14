import { cn } from '@/lib/utils';

const TONES = {
  neutral: 'border-border/70 bg-muted text-muted-foreground',
  positive:
    'border-[oklch(0.82_0.08_150_/_0.6)] bg-[oklch(0.94_0.05_150)] text-[oklch(0.34_0.08_150)]',
  warning: 'border-accent-foreground/15 bg-accent text-accent-foreground',
  danger: 'border-destructive/25 bg-destructive/10 text-destructive',
  info: 'border-primary/20 bg-primary/10 text-primary',
} as const;

const DOTS = {
  neutral: 'bg-muted-foreground/60',
  positive: 'bg-[oklch(0.55_0.12_150)]',
  warning: 'bg-[oklch(0.62_0.12_75)]',
  danger: 'bg-destructive',
  info: 'bg-primary',
} as const;

const TONE_BY_STATUS: Record<string, keyof typeof TONES> = {
  ACTIVE: 'positive',
  SUSPENDED: 'danger',
  PENDING: 'warning',
  APPROVED: 'positive',
  REJECTED: 'danger',
  OPEN: 'warning',
  UNDER_REVIEW: 'info',
  RESOLVED: 'positive',
  DISMISSED: 'neutral',
  CLIENT: 'info',
  DESIGNER: 'info',
  ADMIN: 'info',
  IN_PROGRESS: 'info',
  SUBMITTED: 'warning',
  ON_HOLD: 'warning',
  COMPLETED: 'positive',
  CANCELLED: 'neutral',
  PROCESSING: 'info',
  PAID: 'info',
  RELEASED: 'positive',
  FAILED: 'danger',
  REFUNDED: 'neutral',
  REQUEST: 'info',
  PROPOSAL: 'info',
  PROJECT: 'info',
  STAGE: 'info',
  DELIVERABLE: 'info',
  PAYMENT: 'positive',
  MESSAGE: 'info',
  REVIEW: 'warning',
  VERIFICATION: 'warning',
  SYSTEM: 'neutral',
};

export function StatusPill({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const tone = TONE_BY_STATUS[value] ?? 'neutral';
  const label = value
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider',
        TONES[tone],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('size-1.5 rounded-full', DOTS[tone])}
      />
      {label}
    </span>
  );
}
