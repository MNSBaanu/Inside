'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { InlineAlert } from '@/components/layout/inline-alert';
import { Skeleton } from '@/components/layout/skeleton';
import { formatApiError } from '@/lib/api/auth';
import {
  listProjectActivity,
  type ProjectActivity,
} from '@/lib/api/projects';

export function ProjectActivityFeed({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<ProjectActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await listProjectActivity(projectId);
        if (!cancelled) setItems(data.items);
      } catch (err) {
        if (!cancelled) setError(formatApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return (
    <section className="surface-panel space-y-4 p-5 md:p-6">
      <h2 className="flex items-center gap-2 font-heading text-xl tracking-tight">
        <Activity aria-hidden="true" className="size-4 text-primary" />
        Activity
      </h2>
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ) : null}
      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
      {!loading && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No activity logged for this project yet.
        </p>
      ) : null}
      <ol className="relative space-y-4 border-l border-border/60 pl-5">
        {items.map((item) => (
          <li key={item.id} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[1.6rem] top-1.5 size-2 rounded-full bg-primary/60 ring-4 ring-[var(--background)]"
            />
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {formatAction(item.action)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.user?.name ?? 'System'}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function formatAction(action: string) {
  return action
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
