'use client';

import { Bell, MessageSquare, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { cardSurface } from '@/components/ui/card';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { Avatar } from '@/components/ui/avatar';
import { api, errorMessage } from '@/lib/api/client';
import { useToast } from '@/components/ui/toast';
import { useApi } from '@/lib/api/use-api';
import { useSocketEvent } from '@/lib/realtime/socket';
import type { Notification, ProjectListItem, User } from '@/lib/types';

function useUnreadCounts() {
  const pathname = usePathname();
  const notifications = useApi<{ items: Notification[] }>('/notifications');
  const projects = useApi<{ items: ProjectListItem[] }>('/projects');
  const reloadNotifications = notifications.reload;
  const reloadProjects = projects.reload;

  useEffect(() => {
    void reloadNotifications();
    void reloadProjects();
  }, [pathname, reloadNotifications, reloadProjects]);

  useEffect(() => {
    const onChange = () => void reloadNotifications();
    window.addEventListener('inside:notifications-changed', onChange);
    return () => window.removeEventListener('inside:notifications-changed', onChange);
  }, [reloadNotifications]);

  const toast = useToast();
  useSocketEvent<{ type: string; title?: string }>('notification:new', (event) => {
    void reloadNotifications();
    if (event.title && !(event.type === 'MESSAGE' && pathname.startsWith('/messages'))) {
      toast(event.title);
    }
    if (event.type === 'MESSAGE') void reloadProjects();
  });
  const support = useApi<{ unreadCount: number }>('/support/summary');
  useSocketEvent('conversation:updated', () => {
    void projects.refresh();
    void support.refresh();
  });

  return {
    alerts: notifications.data?.items.filter((item) => item.readAt === null).length ?? 0,
    messages:
      (projects.data?.items.reduce((sum, item) => sum + item.unreadCount, 0) ?? 0) +
      (support.data?.unreadCount ?? 0),
  };
}

export function AccountMenu({ user }: { user: User }) {
  const { logout, refreshUser } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const unread = useUnreadCounts();

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

  const otherRole = user.activeRole === 'DESIGNER' ? 'CLIENT' : 'DESIGNER';
  const toast = useToast();

  async function onSwitchRole() {
    setSwitching(true);
    try {
      await api.patch('/users/me/active-role', { activeRole: otherRole });
      await refreshUser();
      setOpen(false);
      router.push('/dashboard');
    } catch (cause) {
      toast(errorMessage(cause));
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
      <IconLink href="/messages" label="Messages" count={unread.messages} icon={MessageSquare} />
      <IconLink href="/notifications" label="Notifications" count={unread.alerts} icon={Bell} />

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
            className={cn(cardSurface, 'absolute right-0 z-50 mt-3 w-56 p-1 shadow-lift')}
          >
            <div className="border-b border-hairline px-4 py-3">
              <p className="truncate font-semibold">{user.name}</p>
              <p className="truncate text-sm text-muted">{user.email}</p>
            </div>
            <Link
              href="/dashboard"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="mt-1 block rounded-card px-4 py-2.5 text-ink transition-colors duration-150 hover:bg-brand-soft hover:text-brand"
            >
              Dashboard
            </Link>
            {user.role === 'DESIGNER' && user.hasClientAccount ? (
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
  icon: Icon,
}: {
  href: string;
  label: string;
  count: number;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      aria-label={count > 0 ? `${label} (${count} unread)` : label}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink/70 transition-colors duration-300 hover:bg-sand hover:text-brand"
    >
      <Icon aria-hidden strokeWidth={1.75} className="h-5 w-5" />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-5 justify-center rounded-pill bg-brand px-1.5 py-0.5 text-xs text-canvas">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
