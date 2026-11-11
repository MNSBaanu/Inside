import Image from 'next/image';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button, ButtonLink } from '@/components/ui/button';
import { EmptyState, ErrorNotice } from '@/components/ui/feedback';
import { ReviewList } from '@/components/features/reviews/review-list';
import { FavouriteButton } from '@/components/features/designers/favourite-button';
import { BlockButton } from '@/components/features/moderation/block-button';
import { ReportDialog } from '@/components/features/moderation/report-dialog';
import { formatMoney } from '@/lib/utils/format';
import { AutoRefresh } from '@/components/layout/auto-refresh';
import { fetchPublic } from '@/lib/api/server-api';
import type { DesignerProfile, PortfolioImage } from '@/lib/types';
import { isOptimizableImage } from '@/lib/utils/images';

type ProfilePortfolio = {
  id: string;
  title: string;
  description: string | null;
  style: string | null;
  roomType: string | null;
  budget: number | null;
  createdAt: string;
  images: Pick<PortfolioImage, 'id' | 'imageUrl' | 'caption'>[];
};

type ProfileResponse = {
  designer: DesignerProfile;
  portfolios: ProfilePortfolio[];
};

export default async function DesignerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const data = await fetchPublic<ProfileResponse>(`/designers/${params.id}`);

  if (!data) {
    return (
      <div className="shell py-32 md:py-40">
        <ErrorNotice message="Designer not found" />
      </div>
    );
  }

  const { designer, portfolios } = data;
  const cover = portfolios.find((portfolio) => portfolio.images[0])?.images[0];

  return (
    <div className="py-32 md:py-40">
      <AutoRefresh />
      <section className="shell">
        <div className="overflow-hidden rounded-card bg-sand">
          <div className="relative h-48 bg-brand-soft md:h-72">
            {cover ? (
              <Image
                src={cover.imageUrl}
                unoptimized={!isOptimizableImage(cover.imageUrl)}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="px-8 pb-8 md:px-14 md:pb-14">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <Avatar
                name={designer.name}
                src={designer.avatarUrl}
                size={144}
                className="-mt-20 ring-4 ring-sand"
              />
              <div className="mt-6">
                <h1 className="font-display text-section font-semibold">
                  {designer.name}
                </h1>
                <p className="mt-2 text-muted">
                  {designer.location ?? 'Location not set'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {designer.isVerified ? (
                    <Badge tone="support">Verified</Badge>
                  ) : null}
                  {designer.isAvailable ? (
                    <Badge tone="highlight">Available</Badge>
                  ) : (
                    <Badge>Not taking work</Badge>
                  )}
                  {designer.rating.count > 0 ? (
                    <Badge tone="brand">
                      {designer.rating.average?.toFixed(1)} from{' '}
                      {designer.rating.count} reviews
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {designer.isAvailable ? (
                <ButtonLink
                  href={`/requests/new?designerId=${designer.id}`}
                  size="lg"
                >
                  Request this designer
                </ButtonLink>
              ) : (
                <Button disabled size="lg">
                  Not taking new requests
                </Button>
              )}
              <FavouriteButton designerId={designer.id} />
            </div>
          </div>

          {designer.bio ? (
            <p className="mt-10 max-w-3xl text-lg text-muted">{designer.bio}</p>
          ) : null}

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <BlockButton userId={designer.id} />
            <ReportDialog
              targetType="USER"
              targetId={designer.id}
              reportedUserId={designer.id}
            />
          </div>
          </div>
        </div>
      </section>

      <section className="shell mt-20">
        <h2 className="font-display text-section font-semibold">Reviews</h2>
        <div className="mt-10">
          <ReviewList designerId={designer.id} />
        </div>
      </section>

      <section className="shell mt-20">
        <h2 className="font-display text-section font-semibold">Work</h2>

        {portfolios.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="No published work yet."
              description="This designer has not published any projects so far."
            />
          </div>
        ) : (
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {portfolios.map((portfolio) => (
              <Link
                key={portfolio.id}
                href={`/portfolios/${portfolio.id}`}
                className="group block"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-canvas shadow-card">
                  {portfolio.images[0] ? (
                    <Image
                      src={portfolio.images[0].imageUrl}
                      unoptimized={
                        !isOptimizableImage(portfolio.images[0].imageUrl)
                      }
                      alt={portfolio.title}
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                      className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-label font-semibold uppercase text-muted">
                      No images
                    </div>
                  )}
                </div>
                <div className="mt-5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-2xl font-semibold transition-colors duration-300 group-hover:text-brand">
                      {portfolio.title}
                    </h3>
                    {portfolio.budget !== null ? (
                      <p className="mt-1 text-sm text-muted">
                        From {formatMoney(portfolio.budget)}
                      </p>
                    ) : null}
                  </div>
                  {portfolio.style ? (
                    <Badge className="whitespace-nowrap">
                      {portfolio.style}
                    </Badge>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
