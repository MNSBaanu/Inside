import Image from 'next/image';
import Link from 'next/link';
import { formatMoney } from '@/lib/utils/format';
import type { Portfolio, PortfolioImage } from '@/lib/types';
import { isOptimizableImage } from '@/lib/utils/images';

export function PortfolioCard({
  portfolio,
  sizes = '(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw',
  priority = false,
}: {
  portfolio: Pick<Portfolio, 'id' | 'title' | 'style' | 'budget'> & {
    images: Pick<PortfolioImage, 'imageUrl'>[];
    designer?: Pick<Portfolio['designer'], 'name'>;
  };
  sizes?: string;
  priority?: boolean;
}) {
  const cover = portfolio.images[0];
  const meta = [
    portfolio.designer?.name,
    portfolio.budget !== null ? `From ${formatMoney(portfolio.budget)}` : null,
  ].filter(Boolean);

  return (
    <Link
      href={`/portfolios/${portfolio.id}`}
      className="group relative block aspect-[4/3] overflow-hidden rounded-card bg-sand shadow-card"
    >
      {cover ? (
        <Image
          src={cover.imageUrl}
          unoptimized={!isOptimizableImage(cover.imageUrl)}
          alt={portfolio.title}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04]"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-label font-semibold uppercase text-muted">
          No images
        </div>
      )}

      {portfolio.style ? (
        <span className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-ink backdrop-blur">
          {portfolio.style}
        </span>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-5 pb-5 pt-16 transition-colors duration-500 group-hover:from-black/90">
        <h3 className="truncate font-display text-2xl font-semibold text-white">
          {portfolio.title}
        </h3>
        {meta.length > 0 ? (
          <p className="mt-1 truncate text-sm text-white/80">{meta.join(' · ')}</p>
        ) : null}
      </div>
    </Link>
  );
}
