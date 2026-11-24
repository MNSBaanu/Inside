import Image from 'next/image';
import { Avatar } from '@/components/ui/avatar';
import { BackLink } from '@/components/ui/back-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorNotice } from '@/components/ui/feedback';
import { PortfolioCard } from '@/components/features/portfolios/portfolio-card';
import { ReviewList } from '@/components/features/reviews/review-list';
import { FavouriteButton } from '@/components/features/designers/favourite-button';
import { RequestDesignerButton } from '@/components/features/designers/request-designer-button';
import { DesignerActionsMenu } from '@/components/features/designers/designer-actions-menu';
import { AutoRefresh } from '@/components/layout/auto-refresh';
import { fetchPublic } from '@/lib/api/server-api';
import type { DesignerProfile, PortfolioImage } from '@/lib/types';
import { bannerImage, isOptimizableImage } from '@/lib/utils/images';
import { availabilityLabel } from '@/lib/utils/format';

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
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = await paramsPromise;
  const data = await fetchPublic<ProfileResponse>(`/designers/${params.id}`);

  if (!data) {
    return (
      <div className="shell page">
        <ErrorNotice message="Designer not found" />
      </div>
    );
  }

  const { designer, portfolios } = data;
  const cover = portfolios.find((portfolio) => portfolio.images[0])?.images[0];

  return (
    <div className="page">
      <AutoRefresh />
      <section className="shell">
        <BackLink fallback="/explore?tab=designers" />
        <div className="relative mt-4 rounded-card bg-sand">
          <div className="absolute right-4 top-4 z-10">
            <DesignerActionsMenu designerId={designer.id} />
          </div>
          <div className="relative h-28 overflow-hidden rounded-t-card bg-brand-soft md:h-40">
            {cover ? (
              <Image
                src={bannerImage(cover.imageUrl)}
                unoptimized={!isOptimizableImage(cover.imageUrl)}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="px-8 pb-6 md:px-14 md:pb-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <Avatar
                name={designer.name}
                src={designer.avatarUrl}
                size={128}
                className="-mt-16 ring-4 ring-sand"
              />
              <div className="mt-3">
                <h1 className="font-display text-title font-semibold">
                  {designer.name}
                </h1>
                <p className="mt-1 text-muted">
                  {designer.location ?? 'Location not set'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {designer.isVerified ? (
                    <Badge tone="support">Verified</Badge>
                  ) : null}
                  {designer.isAvailable ? (
                    <Badge tone="highlight">
                      {availabilityLabel(true, designer.availableFrom)}
                    </Badge>
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
                <RequestDesignerButton designerId={designer.id} />
              ) : (
                <Button disabled>
                  Not taking new requests
                </Button>
              )}
              <FavouriteButton designerId={designer.id} />
            </div>
          </div>

          {designer.bio ? (
            <p className="mt-4 max-w-3xl text-muted">{designer.bio}</p>
          ) : null}
          </div>
        </div>
      </section>

      <section className="shell mt-12">
        <h2 className="font-display text-2xl font-semibold">Reviews</h2>
        <div className="mt-6">
          <ReviewList endpoint={`/designers/${designer.id}/reviews`} />
        </div>
      </section>

      <section className="shell mt-12">
        <h2 className="font-display text-2xl font-semibold">Work</h2>

        {portfolios.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No published work yet."
              description="This designer has not published any projects so far."
            />
          </div>
        ) : (
          <div className="mt-6 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2">
            {portfolios.map((portfolio, index) => (
              <div
                key={portfolio.id}
                className="w-[85%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
              >
                <PortfolioCard portfolio={portfolio} priority={index < 3} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
