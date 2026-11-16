import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/features/home/reveal';
import { ArrowButton } from '@/components/layout/arrow-button';
import { fetchPublic } from '@/lib/api/server-api';
import type { DesignerSummary, Paginated } from '@/lib/types';
import { heroImage, isOptimizableImage } from '@/lib/utils/images';
import { columns } from '@/components/layout/site-footer';

export async function HomeFooter() {
  const designers = await fetchPublic<Paginated<DesignerSummary>>(
    '/designers?verifiedOnly=true&pageSize=3',
  );
  const avatars = (designers?.items ?? []).filter((d) => d.avatarUrl);

  return (
    <footer className="bg-brand-deep text-canvas">
      <div className="shell pt-14 md:pt-20">
        <Reveal className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-medium leading-[1.05] tracking-[-0.03em]">
            <span className="block md:pl-16">Discover Timeless Interiors</span>
            Crafted for Modern Living
          </h2>
          <div>
            {avatars.length > 0 ? (
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {avatars.map((designer) => (
                    <span
                      key={designer.id}
                      className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-brand-deep"
                    >
                      <Image
                        src={designer.avatarUrl as string}
                        alt={designer.name}
                        fill
                        sizes="32px"
                        unoptimized={!isOptimizableImage(designer.avatarUrl as string)}
                        className="object-cover"
                      />
                    </span>
                  ))}
                </div>
                <p className="text-xs text-canvas/70">Verified designers on Inside</p>
              </div>
            ) : null}
            <div className="mt-4">
              <ArrowButton href="/briefs/new" tone="light" small>
                Start your brief
              </ArrowButton>
            </div>
          </div>
        </Reveal>

        <nav
          aria-label="Footer"
          className="mt-12 grid gap-10 border-t border-canvas/10 pt-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]"
        >
          <ul className="divide-y divide-canvas/10 border-b border-canvas/10 lg:mr-16">
            {columns[0].links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center justify-between py-3 text-sm transition-colors hover:text-white"
                >
                  {link.label}
                  <ArrowUpRight aria-hidden className="h-4 w-4" />
                </Link>
              </li>
            ))}
          </ul>
          {columns.slice(1).map((column) => (
            <div key={column.heading} className="lg:border-l lg:border-canvas/10 lg:pl-6">
              <h3 className="text-sm font-medium">{column.heading}</h3>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={`${column.heading}-${link.label}`}>
                    <Link href={link.href} className="text-sm text-canvas/70 hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="lg:border-l lg:border-canvas/10 lg:pl-6">
            <h3 className="text-sm font-medium">Trust</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/safety" className="text-sm text-canvas/70 hover:text-white">
                  Trust &amp; safety
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        <div className="mt-12 flex flex-col gap-2 text-xs text-canvas/60 sm:flex-row sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Inside. All rights reserved.</p>
          <Link href="/how-it-works" className="hover:text-white">
            How Inside works
          </Link>
        </div>

        <Reveal>
          <p
            aria-hidden
            className="flex select-none items-end justify-center gap-[1.5vw] pt-10 text-[clamp(5rem,21vw,19rem)] font-medium uppercase leading-[0.78] tracking-[-0.04em]"
          >
            <span>Ins</span>
            <span className="relative mb-[0.02em] h-[0.74em] w-[0.36em] shrink-0 overflow-hidden rounded-full">
              <Image src={heroImage} alt="" fill sizes="20vw" className="object-cover" />
            </span>
            <span>de</span>
          </p>
        </Reveal>
      </div>
    </footer>
  );
}
