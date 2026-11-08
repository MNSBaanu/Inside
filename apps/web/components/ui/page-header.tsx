import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { Badge } from './badge';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  variant = 'public',
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: 'public' | 'app';
}) {
  const app = variant === 'app';
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? (
          <Badge tone={app ? 'brand' : 'neutral'}>{eyebrow}</Badge>
        ) : null}
        <h1
          className={cn(
            'mt-6 font-display text-section font-semibold',
            !app && 'max-w-2xl',
          )}
        >
          {title}
        </h1>
        {description ? (
          <p className={cn('mt-4 max-w-xl text-muted', !app && 'text-lg')}>
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
