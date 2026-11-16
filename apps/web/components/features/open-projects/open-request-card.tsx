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
      <p className="inline-flex rounded-pill bg-brand-soft px-2 py-1 text-xs font-semibold text-brand-deep">
        {postedAgo(request.createdAt)}
        <span aria-hidden className="px-1.5">•</span>
        Proposals: {request.proposalCount}
      </p>

      <h3 className="mt-3 text-lg font-semibold leading-snug md:text-xl">
        <button
          type="button"
          onClick={onOpen}
          className="text-left underline-offset-4 after:absolute after:inset-0 group-hover:text-brand group-hover:underline"
        >
          {request.title}
        </button>
      </h3>

      <p className="mt-2 flex flex-wrap items-center gap-y-1 text-sm text-muted [&>span+span]:ml-3 [&>span+span]:border-l [&>span+span]:border-hairline [&>span+span]:pl-3">
        <span>
          Fixed price
          {request.budget !== null ? `: ${formatMoney(request.budget)}` : ''}
        </span>
        {request.timeline ? <span>Est. time: {request.timeline}</span> : null}
        {request.rooms.length > 0 ? (
          <span>
            {request.rooms.length} {request.rooms.length === 1 ? 'room' : 'rooms'}
          </span>
        ) : null}
      </p>

      {request.description ? (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed">{request.description}</p>
      ) : null}

      {tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      ) : null}

      <p className="mt-4 inline-flex items-center gap-1 text-sm text-muted">
        <MapPin aria-hidden className="h-4 w-4" />
        {request.location ?? 'Location not set'}
      </p>
    </li>
  );
}
