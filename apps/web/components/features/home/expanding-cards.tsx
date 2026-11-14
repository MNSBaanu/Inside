'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

type Card = {
  label: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  image: string;
};

export function ExpandingCards({ cards }: { cards: Card[] }) {
  const [active, setActive] = useState(0);

  return (
    <div
      className="flex flex-col gap-4 lg:flex-row"
      onMouseLeave={() => setActive(0)}
    >
      {cards.map((card, index) => {
        const open = index === active;
        return (
          <Link
            key={card.title}
            href={card.href}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            className={`group flex min-w-0 flex-col overflow-hidden rounded-2xl bg-sand transition-all duration-700 ease-editorial ${
              open ? 'lg:flex-[2_1_0%]' : 'lg:flex-[1_1_0%]'
            }`}
          >
            <div className="relative h-[260px] overflow-hidden sm:h-[320px] lg:h-[380px]">
              <Image
                src={card.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04]"
              />
            </div>
            <div className="flex flex-1 flex-col p-4 sm:p-5">
              <p
                className={`font-medium leading-snug tracking-[-0.02em] transition-all duration-700 ${
                  open ? 'text-xl lg:text-2xl' : 'text-xl lg:text-base'
                }`}
              >
                {card.title}
              </p>
              <p
                className={`max-w-md overflow-hidden text-xs leading-relaxed text-muted transition-all duration-700 ${
                  open ? 'mt-3 max-h-24 opacity-100' : 'mt-3 lg:mt-0 lg:max-h-0 lg:opacity-0'
                }`}
              >
                {card.body}
              </p>
              <div className="mt-auto flex items-center justify-between gap-4 pt-5 text-xs text-muted">
                <span>{card.cta}</span>
                <span>{card.label}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
