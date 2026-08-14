import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'error' | 'success' | 'info';

const STYLES: Record<Tone, string> = {
  error: 'border-destructive/25 bg-destructive/[0.07] text-destructive',
  success:
    'border-[oklch(0.82_0.08_150_/_0.6)] bg-[oklch(0.95_0.04_150)] text-[oklch(0.34_0.08_150)]',
  info: 'border-border/70 bg-muted/60 text-muted-foreground',
};

const ICONS: Record<Tone, typeof Info> = {
  error: CircleAlert,
  success: CircleCheck,
  info: Info,
};

export function InlineAlert({
  tone = 'info',
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = ICONS[tone];
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-xl border px-3 py-2 text-sm leading-relaxed',
        STYLES[tone],
        className,
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}
