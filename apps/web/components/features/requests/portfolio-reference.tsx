import Image from 'next/image';
import Link from 'next/link';
import type { PortfolioReference } from '@/lib/types';
import { isOptimizableImage } from '@/lib/utils/images';

export function PortfolioReferenceCard({
  portfolio,
}: {
  portfolio: PortfolioReference;
}) {
  return (
    <Link
      href={`/portfolios/${portfolio.id}`}
      target="_blank"
      className="flex items-center gap-4 rounded-card border border-hairline bg-surface p-3 transition-colors duration-200 hover:border-brand"
    >
      <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-[8px] bg-sand">
        {portfolio.imageUrl ? (
          <Image
            src={portfolio.imageUrl}
            unoptimized={!isOptimizableImage(portfolio.imageUrl)}
            alt=""
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : null}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase tracking-wider text-muted">
          Inspired by
        </span>
        <span className="block truncate font-semibold text-ink">
          {portfolio.title}
        </span>
      </span>
    </Link>
  );
}
