import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/format';
import type { Portfolio } from '@/lib/types';

export function PortfolioCard({
  portfolio,
  sizes = '(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw',
}: {
  portfolio: Portfolio;
  sizes?: string;
}) {
  const cover = portfolio.images[0];

  return (
    <Link href={`/portfolios/${portfolio.id}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-sand shadow-card">
        {cover ? (
          <Image
            src={cover.imageUrl}
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
          <h3 className="truncate font-display text-2xl font-semibold transition-colors duration-300 group-hover:text-clay">
            {portfolio.title}
          </h3>
          <p className="mt-1 truncate text-muted">{portfolio.designer.name}</p>
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
