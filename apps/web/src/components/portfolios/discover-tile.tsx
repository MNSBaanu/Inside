'use client';

import Link from 'next/link';
import { SaveDesignerButton } from '@/components/favourites/save-designer-button';
import type { Portfolio } from '@/lib/api/types';
import { cn } from '@/lib/utils';

const ASPECTS = ['aspect-[4/5]', 'aspect-[4/3]', 'aspect-[1/1]'] as const;

type DiscoverTileProps = {
  portfolio: Portfolio;
  index?: number;
  canSave?: boolean;
  saved?: boolean;
  onSavedChange?: (designerId: string, saved: boolean) => void;
  onError?: (message: string) => void;
};

export function DiscoverTile({
  portfolio,
  index = 0,
  canSave = false,
  saved = false,
  onSavedChange,
  onError,
}: DiscoverTileProps) {
  const cover = portfolio.images[0]?.imageUrl;
  const aspect = ASPECTS[index % ASPECTS.length];

  return (
    <article className="glass group relative overflow-hidden rounded-2xl">
      {canSave ? (
        <SaveDesignerButton
          designerId={portfolio.designerId}
          designerName={portfolio.designer.name}
          saved={saved}
          onSavedChange={(next) => onSavedChange?.(portfolio.designerId, next)}
          onError={onError}
        />
      ) : null}

      <Link href={`/portfolios/${portfolio.id}`} className="block">
        <div className={cn('overflow-hidden bg-muted', aspect)}>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={portfolio.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No image
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent_0%,oklch(0.18_0.03_155_/_0.82)_60%)] p-4 pt-14">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/70">
            {portfolio.style} · {portfolio.roomType}
          </p>
          <h3 className="mt-1 font-heading text-lg leading-snug tracking-tight text-white">
            {portfolio.title}
          </h3>
          <p className="mt-1 flex items-center gap-2 text-xs text-white/75">
            <span>{portfolio.designer.name}</span>
            {portfolio.designer.isVerified ? (
              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                Verified
              </span>
            ) : null}
            {portfolio.budget != null ? (
              <span>· LKR {portfolio.budget.toLocaleString()}</span>
            ) : null}
          </p>
        </div>
      </Link>
    </article>
  );
}
