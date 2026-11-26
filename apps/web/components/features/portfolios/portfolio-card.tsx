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
      className="group relative block aspect-square overflow-hidden rounded-[10px] bg-sand shadow-card"
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
        <span className="absolute right-3 top-3 rounded-[6px] border border-white/15 bg-brand/70 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md">
          {portfolio.style}
        </span>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 border-t border-white/15 bg-brand-deep/60 px-4 py-3 backdrop-blur-md transition-colors duration-500 group-hover:bg-brand-deep/75">
        <h3 className="truncate font-display text-xl font-semibold text-white">
          {portfolio.title}
        </h3>
        {meta.length > 0 ? (
          <p className="mt-1 truncate text-sm text-white/80">{meta.join(' · ')}</p>
        ) : null}
      </div>
    </Link>
  );
}
