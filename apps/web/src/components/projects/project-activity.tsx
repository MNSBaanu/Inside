'use client';

import { useEffect, useState } from 'react';
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
    <section className="surface-panel space-y-4 p-5">
      <h2 className="font-heading text-xl tracking-tight">Activity</h2>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading activity…</p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {!loading && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No activity logged for this project yet.
        </p>
      ) : null}
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-start justify-between gap-2 border-b border-border/40 pb-3 last:border-0 last:pb-0"
          >
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{formatAction(item.action)}</p>
              <p className="text-xs text-muted-foreground">
                {item.user?.name ?? 'System'}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(item.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatAction(action: string) {
  return action
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
