import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'clay' | 'ochre' | 'sage' | 'ink';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-sand text-ink/70',
  clay: 'bg-clay-soft text-clay-deep',
  ochre: 'bg-ochre-soft text-warning',
  sage: 'bg-sage-soft text-success',
  ink: 'bg-ink text-canvas',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill px-3 py-1.5 text-label font-semibold uppercase',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
