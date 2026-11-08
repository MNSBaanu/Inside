'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/feedback';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils/cn';
import type { Role } from '@/lib/types';

const SignOutContext = createContext<() => Promise<void>>(
  async () => undefined,
);

export function useSignOut() {
  return useContext(SignOutContext);
}

type NavItem = { href: string; label: string; roles?: Role[] };

const navigation: NavItem[] = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/briefs', label: 'Briefs', roles: ['CLIENT'] },
  { href: '/moodboards', label: 'Moodboards', roles: ['CLIENT'] },
  { href: '/favourites', label: 'Saved', roles: ['CLIENT'] },
  { href: '/requests', label: 'Requests' },
  { href: '/projects', label: 'Projects' },
  { href: '/portfolios/manage', label: 'My work', roles: ['DESIGNER'] },
  { href: '/verification', label: 'Verification', roles: ['DESIGNER'] },
  { href: '/admin', label: 'Admin', roles: ['ADMIN'] },
  { href: '/account', label: 'Account' },
  { href: '/safety', label: 'Safety' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, status, logout } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const signingOut = useRef(false);

  useEffect(() => {
    if (status === 'unauthenticated' && !signingOut.current) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status !== 'authenticated' || !user) {
    return (
      <div className="shell pb-32 pt-28 md:pb-40 md:pt-32">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="mt-8 h-72 w-full" />
      </div>
    );
  }

  const items = navigation.filter(
    (item) => !item.roles || item.roles.includes(user.activeRole),
  );

  async function onSignOut() {
    signingOut.current = true;
    await logout();
    router.push('/');
  }

  return (
    <div className="shell grid grid-cols-1 gap-12 pb-32 pt-28 md:pb-40 md:pt-32 lg:h-dvh lg:grid-cols-[240px_1fr] lg:overflow-hidden lg:pb-8 lg:pt-24">
      <aside className="h-fit min-w-0 rounded-card bg-sand p-6 [scrollbar-width:none] lg:h-full lg:overflow-y-auto [&::-webkit-scrollbar]:hidden">
        <p className="ui-label text-ink/70">Signed in as</p>
        <p className="mt-2 font-display text-xl font-semibold">{user.name}</p>
        {user.role === 'DESIGNER' ? (
          <RoleToggle activeRole={user.activeRole} />
        ) : (
          <Badge tone="brand" className="mt-3">
            {user.activeRole.toLowerCase()}
          </Badge>
        )}

        <nav className="mt-8 flex gap-2 overflow-x-auto lg:-mx-4 lg:flex-col lg:overflow-visible">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-[0.9375rem] transition-colors duration-300',
                  active
                    ? 'bg-surface font-semibold text-ink shadow-sm'
                    : 'font-medium text-ink/80 hover:bg-canvas hover:text-ink',
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

      <div className="min-w-0 [scrollbar-width:none] lg:h-full lg:overflow-y-auto lg:pb-16 [&::-webkit-scrollbar]:hidden">
        {user.emailVerified ? null : (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-card bg-highlight-soft px-6 py-4">
            <p className="text-sm text-status-action">
              Your email isn&apos;t verified yet.
            </p>
            <Link
              href="/verify-email"
              className="ui-label link-underline text-status-action"
            >
              Verify now
            </Link>
          </div>
        )}
        <SignOutContext.Provider value={onSignOut}>
          {children}
        </SignOutContext.Provider>
      </div>
    </div>
  );
}

function RoleToggle({ activeRole }: { activeRole: Role }) {
  const { refreshUser } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function switchTo(role: Role) {
    if (role === activeRole) return;
    setBusy(true);
    try {
      await api.patch('/users/me/active-role', { activeRole: role });
      await refreshUser();
      router.push('/dashboard');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="group"
      aria-label="Working as"
      className="mt-3 grid grid-cols-2 rounded-pill bg-canvas p-1"
    >
      {(['CLIENT', 'DESIGNER'] as const).map((role) => (
        <button
          key={role}
          type="button"
          disabled={busy}
          onClick={() => switchTo(role)}
          aria-pressed={activeRole === role}
          className={cn(
            'min-h-9 rounded-pill px-3 py-1.5 text-sm font-semibold transition-colors duration-300 disabled:opacity-60',
            activeRole === role
              ? 'bg-ink text-canvas'
              : 'text-ink/70 hover:text-ink',
          )}
        >
          {role === 'CLIENT' ? 'Client' : 'Designer'}
        </button>
      ))}
    </div>
  );
}
