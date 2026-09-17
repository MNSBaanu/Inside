'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { formatDate } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { Brief } from '@/lib/types';

export default function BriefsPage() {
  const { data, error, loading } = useApi<{ items: Brief[] }>('/briefs');

  return (
    <div>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge tone="brand">Briefs</Badge>
          <h1 className="mt-6 font-display text-section font-semibold">
            Your briefs.
          </h1>
          <p className="mt-4 max-w-xl text-muted">
            A brief describes the space you want designed. Designers read it
            before proposing.
          </p>
        </div>
        <ButtonLink href="/briefs/new" size="lg">
          New brief
        </ButtonLink>
      </div>

      <div className="mt-12">
        {error ? <ErrorNotice message={error} /> : null}

        {loading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : data && data.items.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {data.items.map((brief) => (
              <li key={brief.id}>
                <Link
                  href={`/briefs/${brief.id}`}
                  className="block rounded-card border border-hairline bg-surface p-6 transition-colors duration-300 hover:border-brand"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-xl font-semibold">
                        {brief.rooms.join(', ') || 'Untitled brief'}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Created {formatDate(brief.createdAt)}
                      </p>
                    </div>
                    {brief.budgetRange ? (
                      <Badge tone="highlight">{brief.budgetRange}</Badge>
                    ) : null}
                  </div>

                  {brief.styles.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {brief.styles.map((style) => (
                        <Badge key={style}>{style}</Badge>
                      ))}
                    </div>
                  ) : null}

                  {brief.description ? (
                    <p className="mt-4 line-clamp-2 text-muted">
                      {brief.description}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : !error ? (
          <EmptyState
            title="No briefs yet."
            description="Write your first brief and we will match designers to it."
            action={<ButtonLink href="/briefs/new">Start a brief</ButtonLink>}
          />
        ) : null}
      </div>
    </div>
  );
}
