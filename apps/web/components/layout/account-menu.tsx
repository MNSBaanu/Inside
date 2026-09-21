'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { Avatar } from '@/components/ui/avatar';
import { api } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import type { Notification, ProjectListItem, User } from '@/lib/types';

export function AccountMenu({ user }: { user: User }) {
  const { logout, refreshUser } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const notifications = useApi<{ items: Notification[] }>('/notifications');
  const projects = useApi<{ items: ProjectListItem[] }>('/projects');
  const reloadNotifications = notifications.reload;
  const reloadProjects = projects.reload;

  useEffect(() => {
    void reloadNotifications();
    void reloadProjects();
  }, [pathname, reloadNotifications, reloadProjects]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const unreadAlerts =
    notifications.data?.items.filter((item) => item.readAt === null).length ?? 0;
  const unreadMessages =
    projects.data?.items.reduce((sum, item) => sum + item.unreadCount, 0) ?? 0;

  const otherRole = user.activeRole === 'DESIGNER' ? 'CLIENT' : 'DESIGNER';

  async function onSwitchRole() {
    setSwitching(true);
    try {
      await api.patch('/users/me/active-role', { activeRole: otherRole });
      await refreshUser();
      setOpen(false);
      router.push('/dashboard');
    } finally {
      setSwitching(false);
    }
  }

  async function onLogout() {
    setOpen(false);
    await logout();
    window.location.assign('/');
  }

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <IconLink href="/messages" label="Messages" count={unreadMessages}>
        <path d="M4 5h16v11H8l-4 4V5Z" />
      </IconLink>
      <IconLink href="/notifications" label="Notifications" count={unreadAlerts}>
        <path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2Z" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </IconLink>

      <div ref={menuRef} className="relative ml-2">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Account menu - ${user.name}`}
          className="block rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <Avatar name={user.name} src={user.avatarUrl} size={40} />
        </button>

        {open ? (
          <div
            role="menu"
            className="absolute right-0 z-50 mt-3 w-56 rounded-card border border-hairline bg-surface p-1 shadow-lift"
          >
            <div className="border-b border-hairline px-4 py-3">
              <p className="truncate font-semibold">{user.name}</p>
              <p className="truncate text-sm text-muted">{user.email}</p>
            </div>
            {user.role === 'DESIGNER' ? (
              <button
                type="button"
                role="menuitem"
                disabled={switching}
                onClick={onSwitchRole}
                className="mt-1 block w-full rounded-card px-4 py-2.5 text-left text-ink transition-colors duration-150 hover:bg-brand-soft hover:text-brand disabled:opacity-60"
              >
                Switch to {otherRole === 'CLIENT' ? 'client' : 'designer'}
              </button>
            ) : null}
            <Link
              href="/account"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="mt-1 block rounded-card px-4 py-2.5 text-ink transition-colors duration-150 hover:bg-brand-soft hover:text-brand"
            >
              Account
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={onLogout}
              className="block w-full rounded-card px-4 py-2.5 text-left text-ink transition-colors duration-150 hover:bg-brand-soft hover:text-brand"
            >
              Log out
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function IconLink({
  href,
  label,
  count,
  children,
}: {
  href: string;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={count > 0 ? `${label} (${count} unread)` : label}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink/70 transition-colors duration-300 hover:bg-sand hover:text-brand"
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-5 justify-center rounded-pill bg-brand px-1.5 py-0.5 text-xs text-canvas">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
