import { cn } from '@/lib/utils/cn';
import { cardSurface } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { DesignerSummary } from '@/lib/types';
import { isOptimizableImage } from '@/lib/utils/images';

export function DesignerCard({ designer }: { designer: DesignerSummary }) {
  const cover = designer.previews.find((preview) => preview.imageUrl);

  return (
    <Link
      href={`/designers/${designer.id}`}
      className={cn(cardSurface, 'group flex h-full flex-col overflow-hidden transition-shadow duration-500 ease-editorial hover:shadow-lift')}
    >
      <div className="relative h-28 overflow-hidden bg-sand">
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
          size={88}
          className="-mt-11 ring-4 ring-canvas"
        />
        <p className="mt-4 max-w-full truncate font-display text-xl font-semibold transition-colors duration-300 group-hover:text-brand">
          {designer.name}
        </p>
        <p className="max-w-full truncate text-sm text-muted">
          {designer.location ?? 'Location not set'}
        </p>

        {designer.bio ? (
          <p className="mt-4 line-clamp-2 text-sm text-muted">{designer.bio}</p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center justify-center gap-2 pt-6">
          <Badge tone={designer.isAvailable ? 'brand' : 'neutral'}>
            {designer.isAvailable ? 'Available' : 'Not taking work'}
          </Badge>
          {designer.isVerified ? <Badge tone="support">Verified</Badge> : null}
          {designer.rating.count > 0 ? (
            <Badge tone="highlight">
              {designer.rating.average?.toFixed(1)} from {designer.rating.count}{' '}
              {designer.rating.count === 1 ? 'review' : 'reviews'}
            </Badge>
          ) : null}
          <Badge>
            {designer.portfolioCount}{' '}
            {designer.portfolioCount === 1 ? 'project' : 'projects'}
          </Badge>
        </div>
      </div>
    </Link>
  );
}
