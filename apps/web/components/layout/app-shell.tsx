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
import Image from 'next/image';
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
  exact?: boolean;
};

/** A run of sidebar links shown together, split from the next by a divider. */
type NavGroup = { label: string; items: NavItem[] };

/**
 * Each role's sidebar. The second group follows that role's own flow in order;
 * anything outside the flow sits in its own group after it.
 */
const navigation: Record<Role, NavGroup[]> = {
  CLIENT: [
    {
      label: 'Home',
      items: [{ href: '/dashboard', label: 'Overview', icon: LayoutDashboard }],
    },
    {
      // Find designers, collect ideas, describe the job, hire, then work together.
      label: 'Your project, step by step',
      items: [
        { href: '/favourites', label: 'Saved', icon: Heart },
        { href: '/moodboards', label: 'Moodboards', icon: Images },
        { href: '/briefs', label: 'Briefs', icon: FileText },
        { href: '/requests', label: 'Requests', icon: Inbox },
        { href: '/projects', label: 'Projects', icon: FolderKanban },
      ],
    },
  ],
  DESIGNER: [
    {
      label: 'Home',
      items: [{ href: '/dashboard', label: 'Overview', icon: LayoutDashboard }],
    },
    {
      // Win the work, deliver it, keep on top of due dates.
      label: 'Your work, step by step',
      items: [
        { href: '/requests', label: 'Requests', icon: Inbox },
        { href: '/projects', label: 'Projects', icon: FolderKanban },
        { href: '/schedule', label: 'Schedule', icon: CalendarDays },
      ],
    },
    {
      // What clients see before they hire you.
      label: 'Your profile',
      items: [
        { href: '/portfolios/manage', label: 'My work', icon: Palette },
        { href: '/verification', label: 'Verification', icon: BadgeCheck },
      ],
    },
  ],
  ADMIN: [
    {
      label: 'Home',
      items: [{ href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true }],
    },
    {
      // The marketplace in the order it happens: people join, designers are
      // verified, requests come in, projects run, clients review.
      label: 'Marketplace, step by step',
      items: [
        { href: '/admin/users', label: 'Users', icon: Users },
        { href: '/admin/verifications', label: 'Verifications', icon: ShieldCheck },
        { href: '/admin/open-projects', label: 'Open projects', icon: Megaphone },
        { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
        { href: '/admin/reviews', label: 'Reviews', icon: Star },
      ],
    },
    {
      label: 'Moderation',
      items: [{ href: '/admin/reports', label: 'Reports', icon: Flag }],
    },
    {
      label: 'Outreach',
      items: [
        { href: '/admin/announcements', label: 'Announce', icon: Radio },
        { href: '/admin/newsletter', label: 'Newsletter', icon: Newspaper },
        { href: '/admin/contact', label: 'Contact', icon: Mail },
      ],
    },
    {
      label: 'Store',
      items: [{ href: '/admin/shop', label: 'Shop', icon: ShoppingBag }],
    },
    {
      label: 'Insights',
      items: [
        { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
        { href: '/admin/activity', label: 'Activity', icon: Activity },
      ],
    },
  ],
};

/** Account and help, kept at the foot of the sidebar for every role. */
const footer: Record<Role, NavItem[]> = {
  CLIENT: [
    { href: '/account', label: 'Account', icon: UserRound },
    { href: '/safety', label: 'Safety', icon: LifeBuoy },
  ],
  DESIGNER: [
    { href: '/account', label: 'Account', icon: UserRound },
    { href: '/safety', label: 'Safety', icon: LifeBuoy },
  ],
  ADMIN: [{ href: '/account', label: 'Account', icon: UserRound }],
};

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
    return <ShellLoading />;
  }

  const groups = navigation[user.activeRole] ?? [];
  const footerItems = footer[user.activeRole] ?? [];
  const isActive = (item: NavItem) =>
    pathname === item.href || (!item.exact && pathname.startsWith(`${item.href}/`));

  async function onSignOut() {
    signingOut.current = true;
    await logout();
    router.push('/');
  }

  return (
    <div className="lg:pl-[88px]">
      <div className="shell page flex flex-col gap-8 lg:pt-24">
        <aside className="flex min-w-0 items-center gap-3 overflow-x-auto rounded-card bg-ink p-2 text-canvas [scrollbar-width:none] lg:fixed lg:inset-y-0 lg:left-0 lg:z-[60] lg:w-[88px] lg:flex-col lg:gap-0 lg:overflow-hidden lg:rounded-none lg:px-2 lg:py-5 [&::-webkit-scrollbar]:hidden">
          <Link
            href="/"
            aria-label="Inside - home"
            className="mb-6 hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink ring-1 ring-canvas/15 transition-colors duration-300 hover:bg-canvas/10 lg:flex"
          >
            <Image src="/logo.png" alt="" width={226} height={265} className="h-7 w-auto invert" />
          </Link>

          <nav className="flex shrink-0 gap-0.5 [scrollbar-width:none] lg:min-h-0 lg:flex-1 lg:shrink lg:w-full lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden [&::-webkit-scrollbar]:hidden">
            {groups.map((group, index) => (
              <div
                key={group.label}
                role="group"
                aria-label={group.label}
                className={cn(
                  'flex shrink-0 gap-0.5 lg:w-full lg:flex-col',
                  // A thin divider between groups: vertical on the phone bar, horizontal on the rail.
                  index > 0 &&
                    'ml-1 border-l border-canvas/10 pl-1 lg:ml-0 lg:mt-2 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-2',
                )}
              >
                {group.items.map((item) => (
                  <RailLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    active={isActive(item)}
                  />
                ))}
              </div>
            ))}
          </nav>

          <div className="flex shrink-0 gap-0.5 border-l border-canvas/10 pl-1 lg:mt-3 lg:w-full lg:flex-col lg:border-l-0 lg:border-t lg:pl-0 lg:pt-3">
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

/** What the workspace looks like while the session loads: the sidebar and a page-shaped placeholder. */
function ShellLoading() {
  return (
    <div className="lg:pl-[88px]" aria-busy="true" aria-label="Loading your workspace">
      <div className="shell page flex flex-col gap-8 lg:pt-24">
        <aside className="flex min-w-0 items-center gap-3 rounded-card bg-ink p-2 lg:fixed lg:inset-y-0 lg:left-0 lg:z-[60] lg:w-[88px] lg:flex-col lg:gap-0 lg:rounded-none lg:px-2 lg:py-5">
          <span className="mb-6 hidden h-12 w-12 shrink-0 items-center justify-center rounded-full ring-1 ring-canvas/15 lg:flex">
            <Image src="/logo.png" alt="" width={226} height={265} className="h-7 w-auto invert" />
          </span>
          <div className="flex flex-1 gap-2 overflow-hidden lg:w-full lg:flex-col lg:items-center lg:gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <span key={index} className="flex flex-col items-center gap-1.5 px-2 py-1.5">
                <span className="h-5 w-5 animate-pulse rounded-md bg-canvas/15" />
                <span className="hidden h-2 w-12 animate-pulse rounded bg-canvas/10 lg:block" />
              </span>
            ))}
          </div>
          <div className="hidden w-full flex-col items-center gap-4 border-t border-canvas/10 pt-4 lg:flex">
            {Array.from({ length: 3 }).map((_, index) => (
              <span key={index} className="h-5 w-5 animate-pulse rounded-md bg-canvas/15" />
            ))}
          </div>
        </aside>

        <div className="min-w-0">
          <Skeleton className="h-6 w-28 rounded-pill" />
          <Skeleton className="mt-4 h-10 w-72 max-w-full" />
          <Skeleton className="mt-3 h-4 w-96 max-w-full" />
          <Skeleton className="mt-8 h-40 w-full" />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
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
