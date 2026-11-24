'use client';

import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/feedback';
import { hexOf } from '@/components/features/moodboards/style-wizard';
import { renderMoodboardSheet } from '@/lib/moodboard-sheet';

/** The moodboard as one printable image, with a download button. */
export function MoodboardSheet({
  name,
  moodWords,
  palette,
  images,
  clientName,
}: {
  name: string;
  moodWords: string[];
  palette: string[];
  images: string[];
  clientName?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const key = JSON.stringify([name, moodWords, palette, images, clientName ?? '']);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    setUrl(null);
    setFailed(false);
    const [n, words, colours, pictures, client] = JSON.parse(key) as [
      string,
      string[],
      string[],
      string[],
      string,
    ];
    renderMoodboardSheet({
      name: n,
      clientName: client,
      moodWords: words,
      palette: colours.map((swatch) => ({ name: swatch, hex: hexOf(swatch) ?? '#CCCCCC' })),
      images: pictures,
    })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [key]);

  if (failed) {
    return <p className="text-sm text-muted">The moodboard image could not be created.</p>;
  }

  if (!url) return <Skeleton className="aspect-[297/210] w-full" />;

  const fileName = `${name.trim().replace(/[^\w-]+/g, '-').toLowerCase() || 'moodboard'}-moodboard.png`;

  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={`Moodboard: ${name}`}
        className="w-full rounded-[8px] ring-1 ring-hairline"
      />
      <Button
        size="sm"
        variant="outline"
        className="mt-3"
        onClick={() => {
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.click();
        }}
      >
        <Download aria-hidden className="h-4 w-4" />
        Download for print
      </Button>
    </div>
  );
}
