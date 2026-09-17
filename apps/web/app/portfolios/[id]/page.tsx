'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { formatMoney } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { Portfolio } from '@/lib/types';

export default function PortfolioDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data, error, loading } = useApi<{ portfolio: Portfolio }>(
    `/portfolios/${params.id}`,
  );

  if (loading) {
    return (
      <div className="shell py-32 md:py-40">
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="mt-10 aspect-[16/9] w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="shell py-32 md:py-40">
        <ErrorNotice message={error ?? 'Portfolio not found'} />
      </div>
    );
  }

  const { portfolio } = data;
  const [cover, ...rest] = portfolio.images;

  return (
    <div className="py-32 md:py-40">
      <section className="shell">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              {portfolio.style ? (
                <Badge tone="clay">{portfolio.style}</Badge>
              ) : null}
              {portfolio.roomType ? <Badge>{portfolio.roomType}</Badge> : null}
            </div>
            <h1 className="mt-6 max-w-3xl font-display text-section font-semibold">
              {portfolio.title}
            </h1>
          </div>

          {portfolio.budget !== null ? (
            <p className="font-display text-3xl font-semibold text-clay">
              {formatMoney(portfolio.budget)}
            </p>
          ) : null}
        </div>
      </section>

      {cover ? (
        <section className="shell mt-12">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-card shadow-lift">
            <Image
              src={cover.imageUrl}
              alt={cover.caption ?? portfolio.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </section>
      ) : null}

      <section className="shell mt-16 grid gap-16 lg:grid-cols-[2fr_1fr]">
        <div>
          {portfolio.description ? (
            <p className="max-w-2xl text-lg text-muted">
              {portfolio.description}
            </p>
          ) : null}

          {rest.length > 0 ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {rest.map((image) => (
                <figure key={image.id}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-sand">
                    <Image
                      src={image.imageUrl}
                      alt={image.caption ?? portfolio.title}
                      fill
                      sizes="(min-width: 640px) 40vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  {image.caption ? (
                    <figcaption className="mt-3 text-sm text-muted">
                      {image.caption}
                    </figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          ) : null}
        </div>

        <aside className="h-fit rounded-card bg-sand p-8">
          <p className="label text-ink/70">Designed by</p>
          <Link
            href={`/designers/${portfolio.designer.id}`}
            className="mt-5 flex items-center gap-4"
          >
            <Avatar
              name={portfolio.designer.name}
              src={portfolio.designer.avatarUrl}
              size={56}
            />
            <span>
              <span className="block font-display text-xl font-semibold">
                {portfolio.designer.name}
              </span>
              <span className="block text-sm text-muted">
                {portfolio.designer.location ?? 'Location not set'}
              </span>
            </span>
          </Link>

          {portfolio.designer.isVerified ? (
            <div className="mt-5">
              <Badge tone="sage">Verified designer</Badge>
            </div>
          ) : null}

          <ButtonLink
            href={`/requests/new?designerId=${portfolio.designer.id}`}
            size="lg"
            fullWidth
            className="mt-8"
          >
            Request this designer
          </ButtonLink>
        </aside>
      </section>
    </div>
  );
}
