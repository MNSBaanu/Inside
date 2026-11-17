import { MapPin } from 'lucide-react';
import { cardSurface } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import { formatDate, formatMoney } from '@/lib/utils/format';
import { Tag } from '@/components/ui/tag';
import type { OpenRequest } from '@/lib/types';

export function postedAgo(value: string) {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days <= 0) return 'Posted today';
  if (days === 1) return 'Posted yesterday';
  if (days < 30) return `Posted ${days} days ago`;
  return `Posted ${formatDate(value)}`;
}

export function OpenRequestCard({
  request,
  onOpen,
}: {
  request: OpenRequest;
  onOpen: () => void;
}) {
  const tags = [...request.rooms, ...request.styles];

  return (
    <li
      className={cn(
        cardSurface,
        'group relative p-5 transition-colors duration-200 hover:border-ink/25 hover:bg-sand/30 md:p-6',
      )}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between md:gap-10">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">
            {postedAgo(request.createdAt)}
            <span aria-hidden className="px-1.5">·</span>
            {request.proposalCount} {request.proposalCount === 1 ? 'proposal' : 'proposals'}
          </p>

          <h3 className="mt-2 text-lg font-medium leading-snug md:text-xl">
            <button
              type="button"
              onClick={onOpen}
              className="text-left underline-offset-4 after:absolute after:inset-0 group-hover:text-brand group-hover:underline"
            >
              {request.title}
            </button>
          </h3>

          {request.description ? (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink/70">
              {request.description}
            </p>
          ) : null}

          {tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          ) : null}
        </div>

        <dl className="grid shrink-0 grid-cols-2 gap-x-8 gap-y-3 text-sm md:w-52 md:grid-cols-1">
          <div>
            <dt className="text-xs text-muted">Fixed price</dt>
            <dd className="mt-0.5 text-base">
              {request.budget !== null ? formatMoney(request.budget) : 'Open'}
            </dd>
          </div>
          {request.timeline ? (
            <div>
              <dt className="text-xs text-muted">Est. time</dt>
              <dd className="mt-0.5">{request.timeline}</dd>
            </div>
          ) : null}
          <div className="col-span-2 md:col-span-1">
            <dt className="sr-only">Location</dt>
            <dd className="inline-flex items-center gap-1 text-ink/70">
              <MapPin aria-hidden className="h-4 w-4" />
              {request.location ?? 'Location not set'}
            </dd>
          </div>
        </dl>
      </div>
    </li>
  );
}
