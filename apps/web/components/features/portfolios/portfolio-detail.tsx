'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PortfolioGrid } from '@/components/features/portfolios/portfolio-grid';
import { Avatar } from '@/components/ui/avatar';
import { BackLink } from '@/components/ui/back-link';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { RequestDesignerButton } from '@/components/features/designers/request-designer-button';
import { ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { Rating } from '@/components/ui/rating';
import { formatDate, formatMoney } from '@/lib/utils/format';
import { useApi } from '@/lib/api/use-api';
import type { DesignerProfile, Portfolio } from '@/lib/types';
import { isOptimizableImage } from '@/lib/utils/images';

const STYLE_NOTES: Record<string, string> = {
  Bohemian:
    'Layered pattern, natural fibres, plants and collected pieces. Bohemian rooms feel relaxed and personal rather than matched.',
  Coastal:
    'Soft blues, sandy neutrals and light timber. Coastal rooms stay airy, easy to clean and cool in the heat.',
  Contemporary:
    'Clean shapes, a calm base palette and a few confident accents. Contemporary rooms follow current materials and lighting.',
  Industrial:
    'Exposed structure, steel, concrete and reclaimed timber. Industrial rooms celebrate raw materials and open layouts.',
  Japandi:
    'Japanese restraint meets Scandinavian warmth: low furniture, pale timber, linen and very little clutter.',
  Minimalist:
    'Only what is needed, with storage hidden away. Minimalist rooms rely on light, proportion and good materials.',
  Scandinavian:
    'Light walls, pale oak and soft textiles. Scandinavian rooms are bright, practical and comfortable to live in.',
  Traditional:
    'Classic proportions, rich timber and carefully chosen detail. Traditional rooms feel established and welcoming.',
  'Tropical Modern':
    'Cross-ventilation, deep eaves, timber screens and planting. Tropical modern homes stay cool and open to the garden.',
};

export type PortfolioExtras = {
  designer: DesignerProfile | null;
  moreFromDesigner: Portfolio[];
  similar: Portfolio[];
};

function PortfolioRow({ title, items }: { title: string; items: Portfolio[] }) {
  if (items.length === 0) return null;

  return (
    <section className="shell mt-20">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <div className="mt-8">
        <PortfolioGrid items={items} />
      </div>
    </section>
  );
}

export function PortfolioDetail({
  id,
  initial,
  extras = null,
}: {
  id: string;
  initial: { portfolio: Portfolio } | null;
  extras?: PortfolioExtras | null;
}) {
  const fetched = useApi<{ portfolio: Portfolio }>(
    initial ? null : `/portfolios/${id}`,
  );
  const data = initial ?? fetched.data;
  const { error, loading } = fetched;

  if (loading) {
    return (
      <div className="shell page">
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="mt-10 aspect-[16/9] w-full md:aspect-auto md:h-[min(45vh,420px)]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="shell page">
        <ErrorNotice message={error ?? 'Portfolio not found'} />
      </div>
    );
  }

  const { portfolio } = data;
  const [cover, ...rest] = portfolio.images;
  const designer = extras?.designer ?? null;
  const facts: [string, string][] = [
    ['Style', portfolio.style ?? 'Not set'],
    ['Room', portfolio.roomType ?? 'Not set'],
    ['Budget', portfolio.budget !== null ? formatMoney(portfolio.budget) : 'On request'],
    ['Published', formatDate(portfolio.createdAt)],
    ['Photos', String(portfolio.images.length)],
  ];

  return (
    <div className="page">
      <section className="shell">
        <BackLink fallback="/explore" />
        {cover ? null : (
          <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                {portfolio.style ? (
                  <Badge tone="brand">{portfolio.style}</Badge>
                ) : null}
                {portfolio.roomType ? <Badge>{portfolio.roomType}</Badge> : null}
              </div>
              <h1 className="mt-4 max-w-3xl font-display text-title font-semibold">
                {portfolio.title}
              </h1>
            </div>

            {portfolio.budget !== null ? (
              <p className="font-display text-2xl font-semibold text-brand">
                {formatMoney(portfolio.budget)}
              </p>
            ) : null}
          </div>
        )}
      </section>

      {cover ? (
        <section className="shell mt-4">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-card shadow-lift md:aspect-auto md:h-[min(45vh,420px)]">
            <Image
              src={cover.imageUrl}
              unoptimized={!isOptimizableImage(cover.imageUrl)}
              alt={cover.caption ?? portfolio.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />

            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-4 border-b border-white/15 bg-brand-deep/60 px-5 py-4 backdrop-blur-md md:px-6">
              <h1 className="min-w-0 font-display text-2xl font-semibold text-white md:text-3xl">
                {portfolio.title}
              </h1>
              {portfolio.budget !== null ? (
                <p className="shrink-0 font-display text-xl font-semibold text-white md:text-2xl">
                  {formatMoney(portfolio.budget)}
                </p>
              ) : null}
            </div>

            {portfolio.style || portfolio.roomType ? (
              <div className="absolute bottom-4 right-4 flex flex-wrap justify-end gap-2">
                {[portfolio.style, portfolio.roomType].filter(Boolean).map((label) => (
                  <span
                    key={label}
                    className="rounded-[6px] border border-white/15 bg-brand/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-md"
                  >
                    {label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="shell mt-16 grid gap-16 lg:grid-cols-[2fr_1fr]">
        <div>
          {portfolio.description ? (
            <p className="max-w-2xl text-muted">
              {portfolio.description}
            </p>
          ) : null}

          <div className="mt-10 rounded-card border border-hairline p-6">
            <h2 className="label text-ink/70">Project details</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
              {facts.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted">{label}</dt>
                  <dd className="mt-0.5 font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {portfolio.style && STYLE_NOTES[portfolio.style] ? (
            <div className="mt-8">
              <h2 className="font-display text-xl font-semibold">
                About the {portfolio.style} style
              </h2>
              <p className="mt-3 max-w-2xl text-muted">
                {STYLE_NOTES[portfolio.style]}
              </p>
            </div>
          ) : null}

          {rest.length > 0 ? (
            <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-3">
              {rest.map((image) => (
                <figure key={image.id}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-sand">
                    <Image
                      src={image.imageUrl}
                      unoptimized={!isOptimizableImage(image.imageUrl)}
                      alt={image.caption ?? portfolio.title}
                      fill
                      sizes="(min-width: 1024px) 20vw, 50vw"
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

        <aside className="flex h-fit flex-col gap-6">
          <div className="rounded-card bg-sand p-6">
            <p className="label text-ink/70">Designed by</p>
            <Link
              href={`/designers/${portfolio.designer.id}`}
              className="mt-4 flex items-center gap-4"
            >
              <Avatar
                name={portfolio.designer.name}
                src={portfolio.designer.avatarUrl}
                size={48}
              />
              <span>
                <span className="block font-display text-lg font-semibold">
                  {portfolio.designer.name}
                </span>
                <span className="block text-sm text-muted">
                  {portfolio.designer.location ?? 'Location not set'}
                </span>
              </span>
            </Link>

            <div className="mt-4 flex flex-wrap gap-2">
              {portfolio.designer.isVerified ? (
                <Badge tone="support">Verified</Badge>
              ) : null}
              {designer ? (
                designer.isAvailable ? (
                  <Badge tone="highlight">Available</Badge>
                ) : (
                  <Badge>Not taking work</Badge>
                )
              ) : null}
            </div>

            {designer ? (
              <Rating
                value={designer.rating.average}
                count={designer.rating.count}
                className="mt-4"
              />
            ) : null}

            {designer?.bio ? (
              <p className="mt-4 text-sm text-muted">{designer.bio}</p>
            ) : null}

            <div className="mt-6 flex flex-col gap-3">
              {designer?.isAvailable === false ? null : (
                <RequestDesignerButton
                  designerId={portfolio.designer.id}
                  fullWidth
                />
              )}
              <ButtonLink
                href={`/designers/${portfolio.designer.id}`}
                variant="outline"
                fullWidth
              >
                View profile
              </ButtonLink>
            </div>
          </div>
        </aside>
      </section>

      <PortfolioRow
        title={`More from ${portfolio.designer.name}`}
        items={extras?.moreFromDesigner ?? []}
      />
      <PortfolioRow title="Similar projects" items={extras?.similar ?? []} />
    </div>
  );
}
