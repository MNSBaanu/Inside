import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LogoutButton } from '@/components/auth/logout-button';
import type { NavLink } from '@/components/layout/app-shell';

type SiteHeaderProps = {
  variant?: 'public' | 'app';
  title?: string;
  links?: NavLink[];
  overlay?: boolean;
};

export function SiteHeader({
  variant = 'public',
  title,
  links = [],
  overlay = false,
}: SiteHeaderProps) {
  return (
    <header
      className={cn(
        'z-40 border-b',
        overlay
          ? 'absolute inset-x-0 top-0 border-transparent bg-gradient-to-b from-black/45 to-transparent text-white'
          : 'sticky top-0 border-border/70 bg-background/85 backdrop-blur-md',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 items-center gap-4 md:gap-8">
          <Link
            href="/"
            className={cn(
              'font-heading shrink-0 text-xl tracking-tight',
              overlay && 'text-white',
            )}
          >
            Inside
          </Link>
          {title ? (
            <span
              className={cn(
                'hidden text-sm sm:inline',
                overlay ? 'text-white/70' : 'text-muted-foreground',
              )}
            >
              {title}
            </span>
          ) : null}
          {variant === 'app' && links.length > 0 ? (
            <nav className="flex items-center gap-0.5 overflow-x-auto">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    'text-foreground/80',
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
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
    </header>
  );
}
