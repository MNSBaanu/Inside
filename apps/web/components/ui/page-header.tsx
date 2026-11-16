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
    <div
      className={cn(
        'flex flex-col gap-6',
        app && 'md:flex-row md:items-end md:justify-between',
      )}
    >
      <div>
        {eyebrow ? (
          <Badge tone={app ? 'brand' : 'neutral'}>{eyebrow}</Badge>
        ) : null}
        <h1
          className={cn(
            'font-display font-semibold',
            app
              ? 'mt-4 text-3xl tracking-tight md:text-[2.75rem] md:leading-tight'
              : 'mt-4 max-w-3xl text-heading',
          )}
        >
          {title}
        </h1>
        {description ? (
          <p className={cn('max-w-xl text-muted', app ? 'mt-2 text-sm' : 'mt-3 text-base md:text-lg')}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className={cn(!app && '-mt-1')}>{action}</div> : null}
    </div>
  );
}
