'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/layout/empty-state';
import { formatApiError } from '@/lib/api/auth';
import { deleteBrief, listBriefs } from '@/lib/api/briefs';
import type { Brief } from '@/lib/api/types';
import { DEMO_KITCHEN } from '@/lib/media';
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
      <section className="relative overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={DEMO_KITCHEN}
          alt=""
          className="h-40 w-full object-cover md:h-52"
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,oklch(0.18_0.03_155_/_0.75)_0%,oklch(0.18_0.03_155_/_0.3)_75%)]" />
        <div className="absolute inset-0 flex flex-col justify-end gap-4 p-6 md:flex-row md:items-end md:justify-between md:p-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
              Client · Briefs
            </p>
            <h1 className="mt-2 font-heading text-3xl tracking-tight text-white md:text-4xl">
              Design briefs
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/80">
              Capture styles, rooms, and budget — then match designers.
            </p>
          </div>
          <Link
            href="/client/briefs/new"
            className={cn(
              buttonVariants(),
              'bg-white text-[oklch(0.24_0.03_155)] hover:bg-white/90',
            )}
          >
            New brief
          </Link>
        </div>
      </section>

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
