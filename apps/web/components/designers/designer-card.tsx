import Image from 'next/image';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { DesignerSummary } from '@/lib/types';

export function DesignerCard({ designer }: { designer: DesignerSummary }) {
  const cover = designer.previews.find((preview) => preview.imageUrl);

  return (
    <Link
      href={`/designers/${designer.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-hairline bg-surface transition-shadow duration-500 ease-editorial hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        {cover?.imageUrl ? (
          <Image
            src={cover.imageUrl}
            alt={cover.title}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
            className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-label font-semibold uppercase text-muted">
            No work yet
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-3">
          <Avatar name={designer.name} src={designer.avatarUrl} size={44} />
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-semibold transition-colors duration-300 group-hover:text-brand">
              {designer.name}
            </p>
            <p className="truncate text-sm text-muted">
              {designer.location ?? 'Location not set'}
            </p>
          </div>
        </div>

        {designer.bio ? (
          <p className="mt-4 line-clamp-2 text-sm text-muted">{designer.bio}</p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-6">
          {designer.isVerified ? <Badge tone="support">Verified</Badge> : null}
          {designer.rating.count > 0 ? (
            <Badge tone="highlight">
              {designer.rating.average?.toFixed(1)} ({designer.rating.count})
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
