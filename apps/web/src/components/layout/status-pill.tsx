import { cn } from '@/lib/utils';

const TONES = {
  neutral: 'bg-muted text-muted-foreground',
  positive: 'bg-[oklch(0.92_0.06_150)] text-[oklch(0.32_0.08_150)]',
  warning: 'bg-accent text-accent-foreground',
  danger: 'bg-destructive/10 text-destructive',
  info: 'bg-primary/10 text-primary',
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
        'rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider',
        TONES[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
