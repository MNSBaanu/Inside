'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavLink } from '@/components/layout/app-shell';
import { cn } from '@/lib/utils';

function isActive(pathname: string, href: string) {
  if (href === '/client' || href === '/designer' || href === '/admin') {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-0.5 overflow-x-auto rounded-full border border-border/50 bg-foreground/[0.035] p-1 backdrop-blur-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {links.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/40',
              active
                ? 'bg-background text-foreground shadow-[0_1px_2px_oklch(0.22_0.02_145_/_0.12),inset_0_1px_0_oklch(1_0_0_/_0.8)] ring-1 ring-border/60'
                : 'text-foreground/65 hover:bg-background/60 hover:text-foreground',
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
