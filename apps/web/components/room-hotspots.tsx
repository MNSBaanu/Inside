'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/cn';

export type Hotspot = {
  /** Position on the source photo, in percent. */
  x: number;
  y: number;
  title: string;
  body: string;
};

// The frame is 16:10 on phones and 21:9 from md up (see the classes below).
const FRAME_ASPECT = { base: 16 / 10, md: 21 / 9 };

/** Maps a point on the photo to the frame, allowing for object-cover cropping. */
function toFrame(x: number, y: number, frame: number, image: number) {
  if (frame > image) {
    const visible = image / frame;
    return { x, y: ((y / 100 - (1 - visible) / 2) / visible) * 100 };
  }
  const visible = frame / image;
  return { x: ((x / 100 - (1 - visible) / 2) / visible) * 100, y };
}

export function RoomHotspots({
  src,
  alt,
  imageAspect,
  hotspots,
}: {
  src: string;
  alt: string;
  imageAspect: number;
  hotspots: Hotspot[];
}) {
  const [open, setOpen] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open === null) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(null);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(null);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <figure>
      <div
        ref={rootRef}
        className="relative aspect-[16/10] w-full md:aspect-[21/9]"
      >
        <div className="absolute inset-0 overflow-hidden rounded-card shadow-lift">
          <Image
            src={src}
            alt={alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>

        {hotspots.map((spot, index) => {
          const base = toFrame(spot.x, spot.y, FRAME_ASPECT.base, imageAspect);
          const md = toFrame(spot.x, spot.y, FRAME_ASPECT.md, imageAspect);
          const isOpen = open === index;
          const panelId = `hotspot-${index}`;
          return (
            <div
              key={spot.title}
              style={
                {
                  '--x': `${base.x}%`,
                  '--y': `${base.y}%`,
                  '--x-md': `${md.x}%`,
                  '--y-md': `${md.y}%`,
                } as CSSProperties
              }
              className={cn(
                'absolute left-[var(--x)] top-[var(--y)] md:left-[var(--x-md)] md:top-[var(--y-md)]',
                isOpen ? 'z-20' : 'z-10',
              )}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                aria-label={`${index + 1}. ${spot.title}`}
                onClick={() => setOpen(isOpen ? null : index)}
                className="group absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              >
                <span
                  aria-hidden
                  className="absolute h-8 w-8 rounded-pill bg-canvas/70 motion-safe:animate-ping"
                />
                <span
                  aria-hidden
                  className={cn(
                    'relative flex h-8 w-8 items-center justify-center rounded-pill text-sm font-semibold shadow-card ring-2 ring-canvas transition-colors duration-300',
                    isOpen
                      ? 'bg-brand text-canvas'
                      : 'bg-canvas text-brand group-hover:bg-brand group-hover:text-canvas',
                  )}
                >
                  {index + 1}
                </span>
              </button>

              {isOpen ? (
                <div
                  id={panelId}
                  role="note"
                  className={cn(
                    'absolute w-60 max-w-[70vw] rounded-card bg-canvas p-4 shadow-lift sm:w-72',
                    spot.x < 50 ? 'left-0' : 'right-0',
                    spot.y < 50 ? 'top-7' : 'bottom-7',
                  )}
                >
                  <p className="font-display text-lg font-semibold">
                    {spot.title}
                  </p>
                  <p className="mt-1 text-sm text-muted">{spot.body}</p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <figcaption className="mt-4 text-sm text-muted">
        Tap the numbered points to see the design choices in this room.
      </figcaption>
    </figure>
  );
}
