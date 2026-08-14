import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AppNav } from '@/components/layout/app-nav';
import { NotificationBell } from '@/components/layout/notification-bell';
import { LogoutButton } from '@/components/auth/logout-button';
import type { NavLink } from '@/components/layout/app-shell';

type SiteHeaderProps = {
  variant?: 'public' | 'app';
  links?: NavLink[];
  overlay?: boolean;
};

export function SiteHeader({
  variant = 'public',
  links = [],
  overlay = false,
}: SiteHeaderProps) {
  return (
    <header
      className={cn(
        'z-40',
        overlay
          ? 'absolute inset-x-0 top-0'
          : 'sticky top-0 bg-[linear-gradient(180deg,var(--background)_40%,transparent)] pt-3 pb-2',
      )}
    >
      <div className="mx-auto max-w-6xl px-4">
        <div
          className={cn(
            'flex h-14 items-center justify-between gap-4 rounded-full px-4 md:px-5',
            overlay ? 'glass-dark mt-3 text-white' : 'glass-strong',
          )}
        >
          <div className="flex min-w-0 items-center gap-3 md:gap-6">
            <Link
              href="/"
              aria-label="Inside — home"
              className={cn(
                'group/logo flex shrink-0 items-center gap-2 rounded-full transition-opacity hover:opacity-90',
                overlay && 'text-white',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'grid size-7 place-items-center rounded-full border text-[13px] font-semibold',
                  overlay
                    ? 'border-white/30 bg-white/15 text-white'
                    : 'border-primary/15 bg-primary/10 text-primary',
                )}
              >
                In
              </span>
              <span className="font-heading text-xl tracking-tight">Inside</span>
            </Link>
            {variant === 'app' && links.length > 0 ? (
              <AppNav links={links} />
            ) : null}
          </div>
          {variant === 'public' ? (
            <nav className="flex items-center gap-2">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  overlay && 'text-white hover:bg-white/10 hover:text-white',
                )}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: 'sm' }),
                  overlay &&
                    'bg-white text-[oklch(0.24_0.03_155)] hover:bg-white/90',
                )}
              >
                Get started
              </Link>
            </nav>
          ) : (
            <nav className="flex shrink-0 items-center gap-2">
              <NotificationBell />
              <Link
                href="/profile"
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
              >
                Profile
              </Link>
              <LogoutButton />
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
