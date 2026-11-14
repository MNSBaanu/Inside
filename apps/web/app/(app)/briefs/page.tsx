'use client';

import { cn } from '@/lib/utils/cn';
import { cardSurface } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/page-header';
import { formatDate } from '@/lib/utils/format';
import { useApi } from '@/lib/api/use-api';
import type { Brief } from '@/lib/types';

export default function BriefsPage() {
  const { data, error, loading } = useApi<{ items: Brief[] }>('/briefs');

  return (
    <div>
      <PageHeader
        variant="app"
        eyebrow="Briefs"
        title="Your briefs."
        description="A brief describes the space you want designed. Designers read it before proposing."
        action={
          <ButtonLink href="/briefs/new" size="lg">
            New brief
          </ButtonLink>
        }
      />

      <div className="mt-8">
        {error ? <ErrorNotice message={error} /> : null}

        {loading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : data && data.items.length > 0 ? (
          <ul className={cn(cardSurface, 'divide-y divide-hairline overflow-hidden p-0')}>
            {data.items.map((brief) => (
              <li key={brief.id}>
                <Link
                  href={`/briefs/${brief.id}`}
                  className="group grid items-center gap-x-6 gap-y-2 px-5 py-4 transition-colors duration-200 hover:bg-sand/50 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_auto_auto]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold group-hover:text-brand">
                      {brief.rooms.join(', ') || 'Untitled brief'}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-muted">
                      Created {formatDate(brief.createdAt)}
                      {brief.description ? ` · ${brief.description}` : ''}
                    </p>
                  </div>
                  <div className="flex min-w-0 flex-wrap gap-2">
                    {brief.styles.map((style) => (
                      <Badge key={style}>{style}</Badge>
                    ))}
                  </div>
                  <div>
                    {brief.budgetRange ? (
                      <Badge tone="highlight">{brief.budgetRange}</Badge>
                    ) : null}
                  </div>
                  <ChevronRight
                    aria-hidden
                    className="hidden h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand md:block"
                  />
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
