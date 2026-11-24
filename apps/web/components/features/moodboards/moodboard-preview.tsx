import Image from 'next/image';
import { Tag } from '@/components/ui/tag';
import type { MoodboardSummary } from '@/lib/types';
import { isOptimizableImage } from '@/lib/utils/images';

/** A brief's attached moodboard: mood words, palette and the images the client liked. */
export function MoodboardPreview({ board }: { board: MoodboardSummary }) {
  const tags: [string, string[]][] = [
    ['Mood', board.moodWords],
    ['Palette', board.palette],
  ];

  return (
    <div>
      <p className="ui-label text-muted">Moodboard · {board.name}</p>

      {tags.some(([, values]) => values.length > 0) ? (
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          {tags
            .filter(([, values]) => values.length > 0)
            .map(([label, values]) => (
              <div key={label}>
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {values.map((value) => (
                    <Tag key={value}>{value}</Tag>
                  ))}
                </dd>
              </div>
            ))}
        </dl>
      ) : null}

      {board.images.length > 0 ? (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {board.images.map((url, index) => (
            <a
              key={`${url}-${index}`}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="relative aspect-square overflow-hidden rounded-[8px] bg-sand"
            >
              <Image
                src={url}
                unoptimized={!isOptimizableImage(url)}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
