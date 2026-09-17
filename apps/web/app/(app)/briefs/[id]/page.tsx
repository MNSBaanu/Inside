'use client';

import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { formatDate } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { Brief, PartySummary } from '@/lib/types';

type Match = {
  designer: PartySummary;
  score: number;
  matchedPortfolios: { id: string; title: string }[];
};

export default function BriefDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const brief = useApi<{ brief: Brief }>(`/briefs/${params.id}`);
  const matches = useApi<{ briefId: string; items: Match[] }>(
    `/match/designers?briefId=${params.id}`,
  );

  if (brief.loading) {
    return <Skeleton className="h-64" />;
  }

  if (brief.error || !brief.data) {
    return <ErrorNotice message={brief.error ?? 'Brief not found'} />;
  }

  const { brief: item } = brief.data;

  return (
    <div>
      <Badge tone="brand">Brief</Badge>
      <h1 className="mt-6 font-display text-section font-semibold">
        {item.rooms.join(', ') || 'Untitled brief'}
      </h1>
      <p className="mt-4 text-muted">Created {formatDate(item.createdAt)}</p>

      <Card className="mt-12">
        <CardHeader
          title="What you asked for"
          action={
            <ButtonLink
              href={`/requests/new?briefId=${item.id}`}
              variant="outline"
            >
              Open to proposals
            </ButtonLink>
          }
        />

        <dl className="grid gap-8 sm:grid-cols-2">
          <div>
            <dt className="label text-muted">Rooms</dt>
            <dd className="mt-3 flex flex-wrap gap-2">
              {item.rooms.map((room) => (
                <Badge key={room}>{room}</Badge>
              ))}
            </dd>
          </div>
          <div>
            <dt className="label text-muted">Styles</dt>
            <dd className="mt-3 flex flex-wrap gap-2">
              {item.styles.length > 0 ? (
                item.styles.map((style) => <Badge key={style}>{style}</Badge>)
              ) : (
                <span className="text-muted">Not specified</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="label text-muted">Budget range</dt>
            <dd className="mt-3 text-lg">
              {item.budgetRange ?? 'Not specified'}
            </dd>
          </div>
        </dl>

        {item.description ? (
          <div className="mt-8">
            <p className="label text-muted">Description</p>
            <p className="mt-3 whitespace-pre-line text-muted">
              {item.description}
            </p>
          </div>
        ) : null}
      </Card>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold">
          Designers matched to this brief
        </h2>
        <p className="mt-2 text-muted">
          Ranked by how closely their published work matches your styles, rooms
          and budget.
        </p>

        <div className="mt-8">
          {matches.loading ? (
            <Skeleton className="h-40" />
          ) : matches.error ? (
            <ErrorNotice message={matches.error} />
          ) : matches.data && matches.data.items.length > 0 ? (
            <ul className="flex flex-col gap-4">
              {matches.data.items.map((match) => (
                <li
                  key={match.designer.id}
                  className="flex flex-wrap items-center justify-between gap-6 rounded-card border border-hairline bg-surface p-6"
                >
                  <Link
                    href={`/designers/${match.designer.id}`}
                    className="flex items-center gap-4"
                  >
                    <Avatar
                      name={match.designer.name}
                      src={match.designer.avatarUrl}
                      size={56}
                    />
                    <span>
                      <span className="block font-display text-xl font-semibold">
                        {match.designer.name}
                      </span>
                      <span className="block text-sm text-muted">
                        {match.matchedPortfolios.length} matching{' '}
                        {match.matchedPortfolios.length === 1
                          ? 'project'
                          : 'projects'}
                      </span>
                    </span>
                  </Link>

                  <div className="flex items-center gap-4">
                    <Badge tone="highlight">{match.score}% match</Badge>
                    <ButtonLink
                      href={`/requests/new?designerId=${match.designer.id}&briefId=${item.id}`}
                    >
                      Request
                    </ButtonLink>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No strong matches yet."
              description="Try broadening the styles or budget on this brief, or open it to proposals so any designer can respond."
            />
          )}
        </div>
      </section>
    </div>
  );
}
