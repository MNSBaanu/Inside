import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LogoutButton } from '@/components/auth/logout-button';
import type { NavLink } from '@/components/layout/app-shell';

type SiteHeaderProps = {
  variant?: 'public' | 'app';
  title?: string;
  links?: NavLink[];
};

export function SiteHeader({
  variant = 'public',
  title,
  links = [],
}: SiteHeaderProps) {
  return (
    <header className="border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 items-center gap-4 md:gap-6">
          <Link href="/" className="font-heading shrink-0 text-lg tracking-tight">
            Inside
          </Link>
          {title ? (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {title}
            </span>
          ) : null}
          {variant === 'app' && links.length > 0 ? (
            <nav className="flex items-center gap-1 overflow-x-auto">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
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
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
            >
              Log in
            </Link>
            <Link
              href="/register"
              className={cn(buttonVariants({ size: 'sm' }))}
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
