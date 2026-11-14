'use client';

import { cn } from '@/lib/utils/cn';
import { ChevronLeft, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, errorMessage } from '@/lib/api/client';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button, ButtonLink } from '@/components/ui/button';
import { cardSurface } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Pagination } from '@/components/ui/pagination';
import { Rating } from '@/components/ui/rating';
import { FavouriteButton } from '@/components/features/designers/favourite-button';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { formatDate } from '@/lib/utils/format';
import { useApi } from '@/lib/api/use-api';
import type { Brief, PartySummary } from '@/lib/types';

const MATCHES_PER_PAGE = 4;

type Match = {
  designer: PartySummary & { isAvailable?: boolean };
  rating: number | null;
  score: number;
  factors: { key: string; label: string; points: number; max: number }[];
  matchedPortfolios: { id: string; title: string }[];
};

export default function BriefDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [matchPage, setMatchPage] = useState(1);
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

  async function onDelete() {
    setDeleteError(null);
    setDeleting(true);
    try {
      await api.delete(`/briefs/${params.id}`);
      router.push('/briefs');
    } catch (cause) {
      setDeleteError(errorMessage(cause));
      setDeleting(false);
    }
  }

  return (
    <div>
      <Link
        href="/briefs"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand"
      >
        <ChevronLeft aria-hidden className="h-4 w-4" />
        All briefs
      </Link>
      <PageHeader
        variant="app"
        eyebrow="Brief"
        title={item.rooms.join(', ') || 'Untitled brief'}
        description={`Created ${formatDate(item.createdAt)}`}
      />

      <div className={cn(cardSurface, 'mt-8 p-5')}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">What you asked for</h2>
          <div className="flex flex-wrap gap-2">
            <ButtonLink
              href={`/requests/new?briefId=${item.id}`}
              variant="outline"
              size="sm"
            >
              Open to proposals
            </ButtonLink>
            <Link
              href={`/briefs/${item.id}/edit`}
              aria-label="Edit brief"
              title="Edit"
              className="grid h-9 w-9 place-items-center rounded-full text-ink transition-colors hover:bg-sand hover:text-brand"
            >
              <Pencil aria-hidden className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
              aria-label={deleting ? 'Deleting brief' : 'Delete brief'}
              title="Delete"
              className="grid h-9 w-9 place-items-center rounded-full text-ink transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50"
            >
              <Trash2 aria-hidden className="h-4 w-4" />
            </button>
          </div>
        </div>

        {deleteError ? <ErrorNotice message={deleteError} /> : null}
        {confirmDelete ? (
          <ConfirmDialog
            title="Delete this brief?"
            description="The brief will be removed. This cannot be undone."
            onCancel={() => setConfirmDelete(false)}
            onConfirm={() => {
              setConfirmDelete(false);
              void onDelete();
            }}
          />
        ) : null}

        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
          <div>
            <dt className="ui-label text-muted">Rooms</dt>
            <dd className="mt-1.5 flex flex-wrap gap-2">
              {item.rooms.map((room) => (
                <Badge key={room}>{room}</Badge>
              ))}
            </dd>
          </div>
          <div>
            <dt className="ui-label text-muted">Styles</dt>
            <dd className="mt-1.5 flex flex-wrap gap-2">
              {item.styles.length > 0 ? (
                item.styles.map((style) => <Badge key={style}>{style}</Badge>)
              ) : (
                <span className="text-muted">Not specified</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="ui-label text-muted">Budget range</dt>
            <dd className="mt-1.5">
              {item.budgetRange ?? 'Not specified'}
            </dd>
          </div>
        </dl>

        {item.description ? (
          <div className="mt-4 border-t border-hairline pt-4">
            <p className="ui-label text-muted">Description</p>
            <p className="mt-1.5 whitespace-pre-line text-sm text-muted">
              {item.description}
            </p>
          </div>
        ) : null}
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">
          Designers matched to this brief
        </h2>
        <p className="mt-1 text-sm text-muted">
          Ranked by how closely their published work matches your styles, rooms,
          budget and description. These are suggestions only: you decide who to
          hire.
        </p>

        <div className="mt-5">
          {matches.loading ? (
            <Skeleton className="h-40" />
          ) : matches.error ? (
            <div className="flex flex-col items-start gap-3">
              <ErrorNotice message={matches.error} />
              <Button variant="outline" onClick={() => void matches.reload()}>
                Try again
              </Button>
            </div>
          ) : matches.data && matches.data.items.length > 0 ? (
            <>
            <ul className="grid gap-4 lg:grid-cols-2">
              {matches.data.items
                .slice((matchPage - 1) * MATCHES_PER_PAGE, matchPage * MATCHES_PER_PAGE)
                .map((match) => (
                <li
                  key={match.designer.id}
                  className={cn(cardSurface, 'p-4')}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <Link
                      href={`/designers/${match.designer.id}`}
                      className="flex items-center gap-3"
                    >
                      <Avatar
                        name={match.designer.name}
                        src={match.designer.avatarUrl}
                        size={44}
                      />
                      <span>
                        <span className="block font-display text-lg font-semibold">
                          {match.designer.name}
                        </span>
                        <span className="block text-sm text-muted">
                          {match.matchedPortfolios.length} matching{' '}
                          {match.matchedPortfolios.length === 1
                            ? 'project'
                            : 'projects'}
                          {match.designer.location
                            ? ` · ${match.designer.location}`
                            : ''}
                        </span>
                      </span>
                    </Link>
                    <Badge tone="highlight">{match.score}% match</Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {match.designer.isVerified ? (
                      <Badge tone="support">Verified</Badge>
                    ) : null}
                    {match.designer.isAvailable ? (
                      <Badge>Available</Badge>
                    ) : null}
                    <Rating value={match.rating} />
                  </div>

                  <dl className="mt-4 grid gap-x-4 gap-y-2 sm:grid-cols-2">
                    {match.factors.map((factor) => (
                      <div key={factor.key}>
                        <div className="flex justify-between text-sm">
                          <dt className="text-muted">{factor.label}</dt>
                          <dd className="font-semibold">
                            {factor.points}/{factor.max}
                          </dd>
                        </div>
                        <div
                          className="mt-1 h-1.5 rounded-pill bg-sand"
                          aria-hidden
                        >
                          <div
                            className="h-full rounded-pill bg-brand"
                            style={{
                              width: `${(factor.points / factor.max) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <ButtonLink
                      href={`/requests/new?designerId=${match.designer.id}&briefId=${item.id}`}
                      size="sm"
                    >
                      Request
                    </ButtonLink>
                    <FavouriteButton designerId={match.designer.id} />
                  </div>
                </li>
              ))}
            </ul>
            <Pagination
              page={matchPage}
              totalPages={Math.ceil(matches.data.items.length / MATCHES_PER_PAGE)}
              onPageChange={setMatchPage}
              label="Matched designers pages"
            />
            </>
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
