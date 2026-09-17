'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button, ButtonLink } from '@/components/ui/button';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import type { Favourite } from '@/lib/types';

export default function FavouritesPage() {
  const { data, error, loading, reload } =
    useApi<{ items: Favourite[] }>('/favourites');
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function remove(designerId: string) {
    setActionError(null);
    setPending(designerId);
    try {
      await api.delete(`/favourites/${designerId}`);
      await reload();
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setPending(null);
    }
  }

  return (
    <div>
      <Badge tone="brand">Saved</Badge>
      <h1 className="mt-6 font-display text-section font-semibold">
        Designers you saved.
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        A shortlist you can come back to when you are ready to send a request.
      </p>

      <div className="mt-12">
        {error ? <ErrorNotice message={error} /> : null}
        {actionError ? <ErrorNotice message={actionError} /> : null}

        {loading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : data && data.items.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {data.items.map((favourite) => (
              <li
                key={favourite.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-hairline bg-surface p-6"
              >
                <Link
                  href={`/designers/${favourite.designerId}`}
                  className="flex items-center gap-4"
                >
                  <Avatar
                    name={favourite.designer?.name ?? 'Designer'}
                    src={favourite.designer?.avatarUrl}
                    size={48}
                  />
                  <span>
                    <span className="block font-display text-xl font-semibold">
                      {favourite.designer?.name ?? 'Designer'}
                    </span>
                    <span className="block text-sm text-muted">
                      {favourite.designer?.location ?? 'Location not set'}
                    </span>
                  </span>
                </Link>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending === favourite.designerId}
                  onClick={() => remove(favourite.designerId)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        ) : !error ? (
          <EmptyState
            title="Nothing saved yet."
            description="Save designers as you browse so you can compare them later."
            action={<ButtonLink href="/designers">Browse designers</ButtonLink>}
          />
        ) : null}
      </div>
    </div>
  );
}
