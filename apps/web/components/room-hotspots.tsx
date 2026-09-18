'use client';

import {
  Armchair,
  Blinds,
  CreditCard,
  Flower2,
  Lightbulb,
  MessagesSquare,
  Palette,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/cn';

// Icons are referenced by name so hotspot data can come from server components.
const icons = {
  lighting: Lightbulb,
  windows: Blinds,
  accessories: Flower2,
  palette: Palette,
  furniture: Armchair,
  designer: Users,
  messages: MessagesSquare,
  payments: CreditCard,
} satisfies Record<string, LucideIcon>;

export type Hotspot = {
  /** Position on the source photo, in percent. */
  x: number;
  y: number;
  icon: keyof typeof icons;
  title: string;
  body: string;
};

// The frame is 16:10 on phones and 21:9 from md up (see the classes below).
const FRAME_ASPECT = { base: 16 / 10, md: 21 / 9 };
const CLOSE_DELAY_MS = 150;

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
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPointer = useRef<string>('');

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }

  function show(index: number) {
    cancelClose();
    setOpen(index);
  }

  // A short delay lets the cursor cross from the pin onto the card.
  function hideSoon() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(null), CLOSE_DELAY_MS);
  }

  useEffect(() => cancelClose, []);

  // Taps anywhere outside the open pin and its card (including the photo) close it.
  useEffect(() => {
    if (open === null) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Element | null;
      if (!target?.closest(`[data-hotspot="${open}"]`)) setOpen(null);
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
      <div className="relative aspect-[16/10] w-full md:aspect-[21/9]">
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
          const Icon = icons[spot.icon];
          return (
            <div
              key={spot.title}
              data-hotspot={index}
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
              onPointerEnter={(event) => {
                if (event.pointerType === 'mouse') show(index);
              }}
              onPointerLeave={(event) => {
                if (event.pointerType === 'mouse') hideSoon();
              }}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                aria-label={spot.title}
                onPointerDown={(event) => {
                  lastPointer.current = event.pointerType;
                }}
                onClick={(event) => {
                  // Mouse users already opened it by hovering; taps and keys toggle.
                  const byMouse = event.detail > 0 && lastPointer.current === 'mouse';
                  if (byMouse) show(index);
                  else setOpen(isOpen ? null : index);
                }}
                onFocus={() => show(index)}
                onBlur={(event) => {
                  const next = event.relatedTarget as Element | null;
                  if (!next?.closest(`[data-hotspot="${index}"]`)) {
                    setOpen((current) => (current === index ? null : current));
                  }
                }}
                className="group absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              >
                <span
                  aria-hidden
                  className="absolute h-8 w-8 rounded-pill bg-canvas/70 motion-safe:animate-ping"
                />
                <span
                  aria-hidden
                  className={cn(
                    'relative flex h-8 w-8 items-center justify-center rounded-pill shadow-card ring-2 ring-canvas transition-colors duration-300',
                    isOpen
                      ? 'bg-brand text-canvas'
                      : 'bg-canvas text-brand group-hover:bg-brand group-hover:text-canvas',
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
              </button>

              {isOpen ? (
                <div
                  id={panelId}
                  role="note"
                  className={cn(
                    'absolute flex w-64 max-w-[75vw] items-start gap-3 rounded-card bg-canvas p-4 shadow-lift sm:w-72',
                    spot.x < 50 ? 'left-0' : 'right-0',
                    spot.y < 50 ? 'top-7' : 'bottom-7',
                  )}
                >
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-sand text-brand"
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                  <span>
                    <span className="block font-semibold text-ink">
                      {spot.title}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">
                      {spot.body}
                    </span>
                  </span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <figcaption className="mt-4 text-sm text-muted">
        Hover over or tap the icons to see how Inside helps with every part
        of a room.
      </figcaption>
    </figure>
  );
}
