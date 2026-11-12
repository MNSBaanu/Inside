'use client';

import {
  Activity,
  BadgeCheck,
  FileText,
  Flag,
  FolderKanban,
  Heart,
  Images,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Star,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
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

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[];
  exact?: boolean;
};

const members: Role[] = ['CLIENT', 'DESIGNER'];

const navigation: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, roles: members },
  { href: '/briefs', label: 'Briefs', icon: FileText, roles: ['CLIENT'] },
  { href: '/moodboards', label: 'Moodboards', icon: Images, roles: ['CLIENT'] },
  { href: '/favourites', label: 'Saved', icon: Heart, roles: ['CLIENT'] },
  { href: '/requests', label: 'Requests', icon: Inbox, roles: members },
  { href: '/projects', label: 'Projects', icon: FolderKanban, roles: members },
  { href: '/portfolios/manage', label: 'My work', icon: Palette, roles: ['DESIGNER'] },
  { href: '/verification', label: 'Verification', icon: BadgeCheck, roles: ['DESIGNER'] },
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, roles: ['ADMIN'], exact: true },
  { href: '/admin/users', label: 'Users', icon: Users, roles: ['ADMIN'] },
  { href: '/admin/verifications', label: 'Verifications', icon: ShieldCheck, roles: ['ADMIN'] },
  { href: '/admin/reports', label: 'Reports', icon: Flag, roles: ['ADMIN'] },
  { href: '/admin/reviews', label: 'Reviews', icon: Star, roles: ['ADMIN'] },
  { href: '/admin/activity', label: 'Activity', icon: Activity, roles: ['ADMIN'] },
  { href: '/account', label: 'Account', icon: UserRound },
  { href: '/safety', label: 'Safety', icon: LifeBuoy, roles: members },
];

const COLLAPSED_KEY = 'inside.sidebarCollapsed';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, status, logout } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const signingOut = useRef(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSED_KEY) === 'true');
    } catch {}
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      try {
        window.localStorage.setItem(COLLAPSED_KEY, String(!current));
      } catch {}
      return !current;
    });
  }

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
    <div
      className={cn(
        'shell grid grid-cols-1 gap-12 pb-32 pt-28 transition-[grid-template-columns] duration-300 md:pb-40 md:pt-32 lg:h-dvh lg:overflow-hidden lg:pb-8 lg:pt-24',
        collapsed ? 'lg:grid-cols-[72px_1fr] lg:gap-8' : 'lg:grid-cols-[240px_1fr]',
      )}
    >
      <aside
        className={cn(
          'h-fit min-w-0 rounded-card bg-sand p-6 [scrollbar-width:none] lg:flex lg:h-full lg:flex-col lg:overflow-y-auto [&::-webkit-scrollbar]:hidden',
          collapsed && 'lg:items-center lg:px-3',
        )}
      >
        <div className={cn('flex items-start justify-between gap-2', collapsed && 'lg:justify-center')}>
          <div className={cn('min-w-0', collapsed && 'lg:hidden')}>
            <p className="ui-label text-ink/70">Signed in as</p>
            <p className="mt-2 font-display text-xl font-semibold">{user.name}</p>
          </div>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
            title={collapsed ? 'Expand menu' : 'Collapse menu'}
            aria-expanded={!collapsed}
            className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink/70 transition-colors duration-300 hover:bg-canvas hover:text-ink lg:flex"
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden className="h-5 w-5" />
            ) : (
              <PanelLeftClose aria-hidden className="h-5 w-5" />
            )}
          </button>
        </div>
        <div className={cn(collapsed && 'lg:hidden')}>
          {user.role === 'DESIGNER' ? (
            <RoleToggle activeRole={user.activeRole} />
          ) : (
            <Badge tone="brand" className="mt-3">
              {user.activeRole.toLowerCase()}
            </Badge>
          )}
        </div>

        <nav
          className={cn(
            'mt-8 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible',
            collapsed ? 'lg:mt-6 lg:w-full' : 'lg:-mx-4',
          )}
        >
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (!item.exact && pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-3 whitespace-nowrap rounded-xl px-4 py-2.5 text-[0.9375rem] transition-colors duration-300',
                  collapsed && 'lg:justify-center lg:px-0',
                  active
                    ? 'bg-surface font-semibold text-ink shadow-sm'
                    : 'font-medium text-ink/80 hover:bg-canvas hover:text-ink',
                )}
              >
                <Icon aria-hidden className="h-[18px] w-[18px] shrink-0" />
                <span className={cn(collapsed && 'lg:sr-only')}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {collapsed ? (
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sign out"
            title="Sign out"
            className="mt-6 hidden h-11 w-11 items-center justify-center rounded-xl text-ink/70 transition-colors duration-300 hover:bg-canvas hover:text-ink lg:flex"
          >
            <LogOut aria-hidden className="h-[18px] w-[18px]" />
          </button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="mt-8 hidden w-fit lg:inline-flex"
            onClick={onSignOut}
          >
            Sign out
          </Button>
        )}
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
