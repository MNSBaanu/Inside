import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LogoutButton } from '@/components/auth/logout-button';

type SiteHeaderProps = {
  variant?: 'public' | 'app';
  title?: string;
};

export function SiteHeader({ variant = 'public', title }: SiteHeaderProps) {
  return (
    <header className="border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-heading text-lg tracking-tight">
            Inside
          </Link>
          {title ? (
            <span className="text-sm text-muted-foreground">{title}</span>
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
          <nav className="flex items-center gap-2">
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
