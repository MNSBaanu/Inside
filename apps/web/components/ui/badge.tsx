import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export type BadgeTone = 'neutral' | 'brand' | 'highlight' | 'support' | 'ink';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-sand text-ink/70',
  brand: 'bg-brand-soft text-brand-deep',
  highlight: 'bg-highlight-soft text-warning',
  support: 'bg-support-soft text-success',
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
