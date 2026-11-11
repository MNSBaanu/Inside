import { cn } from '@/lib/utils/cn';
import { cardSurface } from '@/components/ui/card';
import { Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { DesignerSummary } from '@/lib/types';
import { formatMoney } from '@/lib/utils/format';
import { isOptimizableImage } from '@/lib/utils/images';

export function DesignerCard({ designer }: { designer: DesignerSummary }) {
  const cover = designer.previews.find((preview) => preview.imageUrl);

  return (
    <Link
      href={`/designers/${designer.id}`}
      className={cn(cardSurface, 'group flex h-full flex-col overflow-hidden transition-shadow duration-500 ease-editorial hover:shadow-lift')}
    >
      <div className="relative h-20 overflow-hidden bg-sand">
        {cover?.imageUrl ? (
          <Image
            src={cover.imageUrl}
            unoptimized={!isOptimizableImage(cover.imageUrl)}
            alt=""
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
            className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04]"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col items-center px-6 pb-6 text-center">
        <Avatar
          name={designer.name}
          src={designer.avatarUrl}
          size={72}
          className="-mt-9 ring-4 ring-canvas"
        />
        <p className="mt-3 max-w-full truncate font-display text-lg font-semibold transition-colors duration-300 group-hover:text-brand">
          {designer.name}
        </p>
        <p className="max-w-full truncate text-sm text-muted">
          {designer.location ?? 'Location not set'}
        </p>
        {designer.rating.count > 0 ? (
          <p className="mt-1 inline-flex items-center gap-1 text-sm">
            <Star aria-hidden className="h-3.5 w-3.5 fill-current text-highlight" />
            {designer.rating.average?.toFixed(1)} from {designer.rating.count}{' '}
            {designer.rating.count === 1 ? 'review' : 'reviews'}
          </p>
        ) : null}

        {designer.bio ? (
          <p className="mt-2 line-clamp-2 text-sm text-muted">{designer.bio}</p>
        ) : null}

        {designer.specialities.length > 0 ? (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {designer.specialities.map((style) => (
              <span
                key={style}
                className="rounded-pill border border-hairline px-2.5 py-0.5 text-xs"
              >
                {style}
              </span>
            ))}
          </div>
        ) : null}

        <p className="mt-3 text-sm text-muted">
          {designer.portfolioCount}{' '}
          {designer.portfolioCount === 1 ? 'project' : 'projects'}
          {designer.startingBudget !== null ? (
            <>
              {' · from '}
              <span className="font-semibold text-ink">
                {formatMoney(designer.startingBudget)}
              </span>
            </>
          ) : null}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-center gap-2 pt-4">
          <Badge tone={designer.isAvailable ? 'brand' : 'neutral'}>
            {designer.isAvailable ? 'Available' : 'Not taking work'}
          </Badge>
          {designer.isVerified ? <Badge tone="support">Verified</Badge> : null}
        </div>
      </div>
    </Link>
  );
}
