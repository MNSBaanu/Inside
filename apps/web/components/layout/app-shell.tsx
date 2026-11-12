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
          'relative h-fit min-w-0 rounded-card bg-brand p-6 text-canvas [scrollbar-width:none] lg:flex lg:h-full lg:flex-col lg:overflow-y-auto [&::-webkit-scrollbar]:hidden',
          collapsed && 'lg:items-center lg:px-3 lg:pt-4',
        )}
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
          title={collapsed ? 'Expand menu' : 'Collapse menu'}
          aria-expanded={!collapsed}
          className={cn(
            'hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-canvas/70 transition-colors duration-300 hover:bg-canvas/10 hover:text-canvas lg:flex',
            !collapsed && 'absolute right-3 top-3',
          )}
        >
          {collapsed ? (
            <PanelLeftOpen aria-hidden className="h-5 w-5" />
          ) : (
            <PanelLeftClose aria-hidden className="h-5 w-5" />
          )}
        </button>

        <div className={cn('min-w-0 lg:pr-8', collapsed && 'lg:hidden')}>
          <p className="ui-label text-canvas/70">Signed in as</p>
          <p className="mt-2 font-display text-xl font-semibold">{user.name}</p>
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
            collapsed ? 'lg:mt-4 lg:w-full' : 'lg:-mx-4',
          )}
        >
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (!item.exact && pathname.startsWith(`${item.href}/`));
            return (
              <SidebarLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={active}
                collapsed={collapsed}
              />
            );
          })}
        </nav>

        <div
          className={cn(
            'mt-8 hidden border-t border-canvas/15 pt-4 lg:mt-auto lg:block',
            collapsed ? 'lg:w-full' : 'lg:-mx-4',
          )}
        >
          <SidebarLink
            label="Sign out"
            icon={LogOut}
            collapsed={collapsed}
            onClick={onSignOut}
          />
        </div>
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

function SidebarLink({
  href,
  label,
  icon: Icon,
  active = false,
  collapsed,
  onClick,
}: {
  href?: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const className = cn(
    'flex min-h-11 w-full items-center gap-3 whitespace-nowrap rounded-xl px-4 py-2.5 text-[0.9375rem] transition-colors duration-300',
    collapsed && 'lg:justify-center lg:px-0',
    active
      ? 'bg-canvas font-semibold text-brand-deep shadow-sm'
      : 'font-medium text-canvas/80 hover:bg-canvas/10 hover:text-canvas',
  );
  const content = (
    <>
      <Icon aria-hidden className="h-[18px] w-[18px] shrink-0" />
      <span className={cn(collapsed && 'lg:sr-only')}>{label}</span>
    </>
  );
  const title = collapsed ? label : undefined;

  if (href) {
    return (
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        title={title}
        className={className}
      >
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} title={title} className={className}>
      {content}
    </button>
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
