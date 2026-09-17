import type { ReactNode } from 'react';
import { Badge } from './badge';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <Badge>{eyebrow}</Badge> : null}
        <h1 className="mt-6 max-w-2xl font-display text-section font-semibold">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-xl text-lg text-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
