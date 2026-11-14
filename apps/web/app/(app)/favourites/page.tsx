'use client';

import { cn } from '@/lib/utils/cn';
import { cardSurface } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { PageHeader } from '@/components/ui/page-header';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api/client';
import { useApi } from '@/lib/api/use-api';
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
      <PageHeader
        variant="app"
        eyebrow="Saved"
        title="Designers you saved."
        description="A shortlist you can come back to when you are ready to send a request."
      />

      <div className="mt-8">
        {error ? <ErrorNotice message={error} /> : null}
        {actionError ? <ErrorNotice message={actionError} /> : null}

        {loading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : data && data.items.length > 0 ? (
          <ul className={cn(cardSurface, 'divide-y divide-hairline overflow-hidden')}>
            {data.items.map((favourite) => (
              <li
                key={favourite.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
              >
                <Link
                  href={`/designers/${favourite.designerId}`}
                  className="group flex min-w-0 items-center gap-3"
                >
                  <Avatar
                    name={favourite.designer?.name ?? 'Designer'}
                    src={favourite.designer?.avatarUrl}
                    size={40}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold group-hover:text-brand">
                      {favourite.designer?.name ?? 'Designer'}
                    </span>
                    <span className="block truncate text-sm text-muted">
                      {favourite.designer?.location ?? 'Location not set'}
                    </span>
                  </span>
                </Link>

                <div className="flex items-center gap-2">
                  <ButtonLink
                    href={`/requests/new?designerId=${favourite.designerId}`}
                    size="sm"
                  >
                    Send request
                  </ButtonLink>
                  <button
                    type="button"
                    disabled={pending === favourite.designerId}
                    onClick={() => remove(favourite.designerId)}
                    aria-label={`Remove ${favourite.designer?.name ?? 'designer'} from saved`}
                    title="Remove from saved"
                    className="grid h-9 w-9 place-items-center rounded-full text-ink transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50"
                  >
                    <Trash2 aria-hidden className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : !error ? (
          <EmptyState
            title="Nothing saved yet."
            description="Save designers as you browse so you can compare them later."
            action={<ButtonLink href="/explore?tab=designers">Browse designers</ButtonLink>}
          />
        ) : null}
      </div>
    </div>
  );
}
