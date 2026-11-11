import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/utils/format';
import type { Portfolio, PortfolioImage } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import { isOptimizableImage } from '@/lib/utils/images';

export function PortfolioCard({
  portfolio,
  sizes = '(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw',
  compact = false,
}: {
  portfolio: Pick<Portfolio, 'id' | 'title' | 'style' | 'budget'> & {
    images: Pick<PortfolioImage, 'imageUrl'>[];
    designer?: Pick<Portfolio['designer'], 'name'>;
  };
  sizes?: string;
  compact?: boolean;
}) {
  const cover = portfolio.images[0];

  return (
    <Link href={`/portfolios/${portfolio.id}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-sand shadow-card">
        {cover ? (
          <Image
            src={cover.imageUrl}
            unoptimized={!isOptimizableImage(cover.imageUrl)}
            alt={portfolio.title}
            fill
            sizes={sizes}
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
          <h3
            className={cn(
              'truncate font-display font-semibold transition-colors duration-300 group-hover:text-brand',
              compact ? 'text-lg' : 'text-2xl',
            )}
          >
            {portfolio.title}
          </h3>
          {portfolio.designer ? (
            <p className="mt-1 truncate text-muted">{portfolio.designer.name}</p>
          ) : null}
        </div>
        {portfolio.style ? (
          <Badge className="whitespace-nowrap">{portfolio.style}</Badge>
        ) : null}
      </div>

      {portfolio.budget !== null ? (
        <p className="mt-2 text-sm text-muted">
          From {formatMoney(portfolio.budget)}
        </p>
      ) : null}
    </Link>
  );
}
