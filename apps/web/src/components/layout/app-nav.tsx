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
    <nav className="flex items-center gap-0.5 overflow-x-auto rounded-full border border-border/50 bg-foreground/[0.035] p-1 backdrop-blur-sm">
      {links.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-colors',
              active
                ? 'bg-background/90 text-foreground shadow-sm'
                : 'text-foreground/70 hover:bg-background/50 hover:text-foreground',
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
