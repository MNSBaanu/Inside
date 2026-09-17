'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { formatMoney } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { DesignerProfile, PortfolioImage } from '@/lib/types';

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

export default function DesignerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const { data, error, loading } = useApi<ProfileResponse>(
    `/designers/${params.id}`,
  );

  if (loading) {
    return (
      <div className="shell py-32 md:py-40">
        <Skeleton className="h-40" />
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="shell py-32 md:py-40">
        <ErrorNotice message={error ?? 'Designer not found'} />
      </div>
    );
  }

  const { designer, portfolios } = data;

  return (
    <div className="py-32 md:py-40">
      <section className="shell">
        <div className="rounded-card bg-sand p-8 md:p-14">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-6">
              <Avatar name={designer.name} src={designer.avatarUrl} size={96} />
              <div>
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

            <ButtonLink href={`/requests/new?designerId=${designer.id}`} size="lg">
              Request this designer
            </ButtonLink>
          </div>

          {designer.bio ? (
            <p className="mt-10 max-w-3xl text-lg text-muted">{designer.bio}</p>
          ) : null}
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
