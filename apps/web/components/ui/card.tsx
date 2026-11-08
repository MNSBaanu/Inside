import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export const cardSurface = 'rounded-card border border-hairline bg-surface';

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn(cardSurface, 'p-6 md:p-8', className)}>{children}</div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
