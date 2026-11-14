'use client';

import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

type Slide = { id: string; title: string; style: string; src: string };

export function SpotlightCarousel({
  slides,
  hotspot,
}: {
  slides: Slide[];
  hotspot: { title: string; src: string; href: string };
}) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const go = (step: number) =>
    setIndex((current) => (current + step + slides.length) % slides.length);

  return (
    <div className="relative flex min-h-[560px] items-end overflow-hidden rounded-2xl p-4 sm:p-8 md:min-h-[680px]">
      {slides.map((item, i) => (
        <Image
          key={item.id}
          src={item.src}
          alt={i === index ? item.title : ''}
          fill
          sizes="100vw"
          className={`object-cover transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}

      <Link
        href={hotspot.href}
        className="absolute left-1/2 top-[38%] hidden items-start gap-2 md:flex"
      >
        <span className="mt-1 h-3 w-3 rounded-full border-2 border-white bg-white/40" />
        <span className="w-40 rounded-xl bg-canvas/95 p-2 shadow-lg">
          <span className="block px-1 pb-2 text-xs font-medium">{hotspot.title}</span>
          <span className="relative block aspect-[4/3] overflow-hidden rounded-lg">
            <Image src={hotspot.src} alt="" fill sizes="160px" className="object-cover" />
          </span>
        </span>
      </Link>

      <div className="relative w-full max-w-sm rounded-xl bg-canvas/95 p-5 shadow-lg backdrop-blur sm:p-6">
        <p className="text-xl font-medium tracking-[-0.02em]">{slide.title}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted">
          <MapPin aria-hidden className="h-3.5 w-3.5" /> {slide.style}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          An illustrative project showing how a brief becomes a finished,
          livable room.
        </p>
        <div className="mt-6 flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous project"
            className="grid h-8 w-8 place-items-center rounded-full border border-ink/20 transition-colors hover:bg-brand hover:text-canvas"
          >
            <ChevronLeft aria-hidden className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next project"
            className="grid h-8 w-8 place-items-center rounded-full border border-ink transition-colors hover:bg-brand hover:text-canvas"
          >
            <ChevronRight aria-hidden className="h-4 w-4" />
          </button>
          <div className="ml-1 flex gap-1" aria-hidden>
            {slides.map((item, i) => (
              <span
                key={item.id}
                className={`h-1 rounded-full transition-all ${i === index ? 'w-4 bg-ink' : 'w-1 bg-ink/30'}`}
              />
            ))}
          </div>
          <Link
            href="/explore"
            className="ml-auto text-sm font-medium underline decoration-ink/30 underline-offset-4 hover:decoration-ink"
          >
            View work
          </Link>
        </div>
      </div>
    </div>
  );
}
