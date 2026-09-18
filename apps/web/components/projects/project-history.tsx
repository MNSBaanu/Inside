'use client';

import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { formatDate, titleCase } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { ActivityEntry } from '@/lib/types';

export function describeActivity(entry: ActivityEntry) {
  const name = entry.metadata?.name;
  const version = entry.metadata?.version;
  return [
    titleCase(entry.action),
    typeof name === 'string' ? titleCase(name) : null,
    typeof version === 'number' ? `v${version}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function ProjectHistory({ projectId }: { projectId: string }) {
  const activity = useApi<{ items: ActivityEntry[] }>(
    `/projects/${projectId}/activity`,
  );

  if (activity.loading) return <Skeleton className="h-48" />;
  if (activity.error) return <ErrorNotice message={activity.error} />;

  const items = activity.data?.items ?? [];
  if (items.length === 0) return <EmptyState title="No activity yet." />;

  return (
    <ul className="flex flex-col divide-y divide-hairline rounded-card border border-hairline bg-surface">
      {items.map((entry) => {
        const reason = entry.metadata?.reason;
        return (
          <li
            key={entry.id}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 p-5"
          >
            <div className="min-w-0">
              <p className="font-semibold first-letter:uppercase">
                {describeActivity(entry)}
              </p>
              <p className="mt-1 text-sm text-muted">
                {entry.user?.name ?? 'System'}
              </p>
              {typeof reason === 'string' ? (
                <p className="mt-2 whitespace-pre-line break-words text-sm">
                  {reason}
                </p>
              ) : null}
            </div>
            <p className="text-sm text-muted">{formatDate(entry.createdAt)}</p>
          </li>
        );
      })}
    </ul>
  );
}
