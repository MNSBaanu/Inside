'use client';

import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  BadgeCheck,
  CalendarDays,
  FileText,
  Flag,
  FolderKanban,
  Heart,
  Images,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Mail,
  Megaphone,
  Newspaper,
  Radio,
  Palette,
  ShieldCheck,
  ShoppingBag,
  Star,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AnnouncementBanner } from '@/components/features/announcements/announcement-banner';
import { useSession } from '@/components/providers/session-provider';
import { Skeleton } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api/client';
import { useToast } from '@/components/ui/toast';
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

const footerHrefs = ['/account', '/safety'];

const navigation: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, roles: members },
  { href: '/briefs', label: 'Briefs', icon: FileText, roles: ['CLIENT'] },
  { href: '/moodboards', label: 'Moodboards', icon: Images, roles: ['CLIENT'] },
  { href: '/favourites', label: 'Saved', icon: Heart, roles: ['CLIENT'] },
  { href: '/requests', label: 'Requests', icon: Inbox, roles: members },
  { href: '/projects', label: 'Projects', icon: FolderKanban, roles: members },
  { href: '/schedule', label: 'Schedule', icon: CalendarDays, roles: ['DESIGNER'] },
  { href: '/portfolios/manage', label: 'My work', icon: Palette, roles: ['DESIGNER'] },
  { href: '/verification', label: 'Verification', icon: BadgeCheck, roles: ['DESIGNER'] },
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, roles: ['ADMIN'], exact: true },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, roles: ['ADMIN'] },
  { href: '/admin/users', label: 'Users', icon: Users, roles: ['ADMIN'] },
  { href: '/admin/projects', label: 'Projects', icon: FolderKanban, roles: ['ADMIN'] },
  { href: '/admin/open-projects', label: 'Open projects', icon: Megaphone, roles: ['ADMIN'] },
  { href: '/admin/shop', label: 'Shop', icon: ShoppingBag, roles: ['ADMIN'] },
  { href: '/admin/verifications', label: 'Verifications', icon: ShieldCheck, roles: ['ADMIN'] },
  { href: '/admin/reports', label: 'Reports', icon: Flag, roles: ['ADMIN'] },
  { href: '/admin/reviews', label: 'Reviews', icon: Star, roles: ['ADMIN'] },
  { href: '/admin/contact', label: 'Contact', icon: Mail, roles: ['ADMIN'] },
  { href: '/admin/announcements', label: 'Announce', icon: Radio, roles: ['ADMIN'] },
  { href: '/admin/newsletter', label: 'Newsletter', icon: Newspaper, roles: ['ADMIN'] },
  { href: '/admin/activity', label: 'Activity', icon: Activity, roles: ['ADMIN'] },
  { href: '/account', label: 'Account', icon: UserRound },
  { href: '/safety', label: 'Safety', icon: LifeBuoy, roles: members },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, status, logout } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const signingOut = useRef(false);
  useEffect(() => {
    if (status === 'unauthenticated' && !signingOut.current) {
      router.replace(
        `/login?next=${encodeURIComponent(pathname + window.location.search)}`,
      );
    }
  }, [status, router, pathname]);

  if (status !== 'authenticated' || !user) {
    return (
      <div className="shell page">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="mt-8 h-72 w-full" />
      </div>
    );
  }

  const items = navigation.filter(
    (item) => !item.roles || item.roles.includes(user.activeRole),
  );
  const isActive = (item: NavItem) =>
    pathname === item.href || (!item.exact && pathname.startsWith(`${item.href}/`));
  const mainItems = items.filter((item) => !footerHrefs.includes(item.href));
  const footerItems = items.filter((item) => footerHrefs.includes(item.href));

  async function onSignOut() {
    signingOut.current = true;
    await logout();
    router.push('/');
  }

  return (
    <div className="lg:pl-[88px]">
      <div className="shell page flex flex-col gap-8 lg:pt-24">
        <aside className="flex min-w-0 items-center gap-3 rounded-card bg-ink p-2 text-canvas [scrollbar-width:none] lg:fixed lg:inset-y-0 lg:left-0 lg:z-[60] lg:w-[88px] lg:flex-col lg:gap-0 lg:overflow-hidden lg:rounded-none lg:px-2 lg:py-5 [&::-webkit-scrollbar]:hidden">
          <Link
            href="/"
            aria-label="Inside - home"
            className="mb-6 hidden font-display text-3xl font-semibold leading-none tracking-tight text-canvas lg:block"
          >
            I<span className="text-brand-soft">.</span>
          </Link>

          <nav className="flex flex-1 gap-0.5 overflow-x-auto [scrollbar-width:none] lg:min-h-0 lg:w-full lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden [&::-webkit-scrollbar]:hidden">
            {mainItems.map((item) => (
              <RailLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={isActive(item)}
              />
            ))}
          </nav>

          <div className="flex shrink-0 gap-0.5 lg:mt-3 lg:w-full lg:flex-col lg:border-t lg:border-canvas/10 lg:pt-3">
            {user.role === 'DESIGNER' && user.hasClientAccount ? <RoleSwitch activeRole={user.activeRole} /> : null}
            {footerItems.map((item) => (
              <RailLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={isActive(item)}
              />
            ))}
            <RailLink label="Sign out" icon={LogOut} onClick={onSignOut} />
          </div>
        </aside>

        <div className="min-w-0">
          <AnnouncementBanner />
          <SignOutContext.Provider value={onSignOut}>
            {children}
          </SignOutContext.Provider>
        </div>
      </div>
    </div>
  );
}

function RailLink({
  href,
  label,
  icon: Icon,
  active = false,
  onClick,
  ariaLabel,
  disabled,
}: {
  href?: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const className = cn(
    'group flex min-w-[4.5rem] shrink-0 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-center text-[0.6875rem] leading-tight transition-colors duration-300 disabled:opacity-60 lg:w-full lg:min-w-0',
    active ? 'font-semibold text-canvas' : 'font-medium text-canvas/65 hover:text-canvas',
  );
  const content = (
    <>
      <span
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-300',
          active ? 'bg-canvas/15' : 'group-hover:bg-canvas/10',
        )}
      >
        <Icon aria-hidden className="h-[18px] w-[18px]" />
      </span>
      <span>{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} aria-current={active ? 'page' : undefined} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={className}
    >
      {content}
    </button>
  );
}

function RoleSwitch({ activeRole }: { activeRole: Role }) {
  const { refreshUser } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const target: Role = activeRole === 'DESIGNER' ? 'CLIENT' : 'DESIGNER';

  async function switchRole() {
    setBusy(true);
    try {
      await api.patch('/users/me/active-role', { activeRole: target });
      await refreshUser();
      router.push('/dashboard');
    } catch (cause) {
      toast(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <RailLink
      label={target === 'CLIENT' ? 'Client view' : 'Designer view'}
      ariaLabel={target === 'CLIENT' ? 'Switch to client' : 'Switch to designer'}
      icon={ArrowLeftRight}
      onClick={switchRole}
      disabled={busy}
    />
  );
}
