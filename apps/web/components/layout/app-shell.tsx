'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/feedback';
import { cn } from '@/lib/cn';
import type { Role } from '@/lib/types';

type NavItem = { href: string; label: string; roles?: Role[] };

const navigation: NavItem[] = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/briefs', label: 'Briefs', roles: ['CLIENT'] },
  { href: '/moodboards', label: 'Moodboards', roles: ['CLIENT'] },
  { href: '/favourites', label: 'Saved', roles: ['CLIENT'] },
  { href: '/requests', label: 'Requests' },
  { href: '/projects', label: 'Projects' },
  { href: '/messages', label: 'Messages' },
  { href: '/notifications', label: 'Alerts' },
  { href: '/portfolios/manage', label: 'My work', roles: ['DESIGNER'] },
  { href: '/verification', label: 'Verification', roles: ['DESIGNER'] },
  { href: '/admin', label: 'Admin', roles: ['ADMIN'] },
  { href: '/account', label: 'Account' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, status, logout } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status !== 'authenticated' || !user) {
    return (
      <div className="shell py-32 md:py-40">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="mt-8 h-72 w-full" />
      </div>
    );
  }

  const items = navigation.filter(
    (item) => !item.roles || item.roles.includes(user.activeRole),
  );

  async function onSignOut() {
    await logout();
    router.push('/');
  }

  return (
    <div className="shell grid gap-12 py-32 md:py-40 lg:grid-cols-[240px_1fr]">
      <aside className="h-fit lg:sticky lg:top-28">
        <p className="label text-muted">Signed in as</p>
        <p className="mt-2 font-display text-xl font-semibold">{user.name}</p>
        <p className="text-sm text-muted">{user.activeRole.toLowerCase()}</p>

        <nav className="mt-8 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'whitespace-nowrap rounded-pill px-4 py-2.5 text-label font-semibold uppercase transition-colors duration-300',
                  active
                    ? 'bg-brand text-canvas'
                    : 'text-ink/70 hover:bg-sand hover:text-ink',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Button
          variant="outline"
          size="sm"
          className="mt-8 hidden lg:inline-flex"
          onClick={onSignOut}
        >
          Sign out
        </Button>
      </aside>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
