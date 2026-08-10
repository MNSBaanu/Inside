'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { formatApiError } from '@/lib/api/auth';
import { deleteBrief, listBriefs } from '@/lib/api/briefs';
import type { Brief } from '@/lib/api/types';
import { cn } from '@/lib/utils';

export function BriefsList() {
  const [items, setItems] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listBriefs();
      setItems(data.items);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onDelete(id: string) {
    if (!window.confirm('Delete this brief?')) return;
    setBusyId(id);
    setError(null);
    try {
      await deleteBrief(id);
      setItems((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Client · Briefs"
        title="Design briefs"
        description="Capture styles, rooms, and budget — then match designers."
        actions={
          <Link href="/client/briefs/new" className={cn(buttonVariants())}>
            New brief
          </Link>
        }
      />

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading briefs…</p>
      ) : null}

      {!loading && items.length === 0 ? (
        <EmptyState
          title="No briefs yet"
          description="Create a brief from scratch or generate one from a moodboard."
          actionHref="/client/briefs/new"
          actionLabel="New brief"
        />
      ) : null}

      <ul className="space-y-3">
        {items.map((brief) => (
          <li
            key={brief.id}
            className="surface-panel flex flex-wrap items-center justify-between gap-3 p-5"
          >
            <div>
              <p className="font-heading text-lg tracking-tight">
                {brief.styles.slice(0, 3).join(', ') || 'Untitled brief'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {brief.rooms.join(', ') || 'No rooms'}
                {brief.budgetRange ? ` · ${brief.budgetRange}` : ''}
                {brief.moodboard ? ` · ${brief.moodboard.name}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/client/briefs/${brief.id}/match`}
                className={cn(buttonVariants({ size: 'sm' }))}
              >
                Match
              </Link>
              <Link
                href={`/client/briefs/${brief.id}`}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                Edit
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busyId === brief.id}
                onClick={() => onDelete(brief.id)}
              >
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
