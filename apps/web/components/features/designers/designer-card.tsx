import { cn } from '@/lib/utils/cn';
import { cardSurface } from '@/components/ui/card';
import { BadgeCheck, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
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
      <div className="relative h-16 overflow-hidden bg-sand">
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
        {designer.isVerified ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-pill bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-ink backdrop-blur">
            <BadgeCheck aria-hidden className="h-3.5 w-3.5 text-brand" />
            Verified
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col items-center px-5 pb-4 text-center">
        <Avatar
          name={designer.name}
          src={designer.avatarUrl}
          size={56}
          className="-mt-7 ring-4 ring-canvas"
        />
        <p className="mt-2 max-w-full truncate font-display text-lg font-semibold transition-colors duration-300 group-hover:text-brand">
          {designer.name}
        </p>
        <div className="flex max-w-full items-center gap-1.5 text-sm text-muted">
          <span className="truncate">{designer.location ?? 'Location not set'}</span>
          {designer.rating.count > 0 ? (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex shrink-0 items-center gap-1 text-ink">
                <Star aria-hidden className="h-3.5 w-3.5 fill-current text-highlight" />
                {designer.rating.average?.toFixed(1)} from {designer.rating.count}{' '}
                {designer.rating.count === 1 ? 'review' : 'reviews'}
              </span>
            </>
          ) : null}
        </div>

        {designer.bio ? (
          <p className="mt-1.5 line-clamp-1 text-sm text-muted">{designer.bio}</p>
        ) : null}

        {designer.specialities.length > 0 ? (
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
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

        <div className="mt-auto w-full pt-3">
          <div className="flex items-end justify-between gap-3 border-t border-hairline pt-3 text-left">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-sm font-semibold',
                designer.isAvailable ? 'text-brand' : 'text-muted',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'h-2 w-2 rounded-full',
                  designer.isAvailable ? 'bg-brand' : 'bg-muted',
                )}
              />
              {designer.isAvailable ? 'Available' : 'Not taking work'}
            </span>
            <div className="min-w-0 text-right">
              <p className="text-xs text-muted">
                {designer.portfolioCount}{' '}
                {designer.portfolioCount === 1 ? 'project' : 'projects'}
              </p>
              {designer.startingBudget !== null ? (
                <p className="truncate text-sm text-muted">
                  from{' '}
                  <span className="font-semibold text-ink">
                    {formatMoney(designer.startingBudget)}
                  </span>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
