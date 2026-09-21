'use client';

import Link from 'next/link';
import { usePathname, useSelectedLayoutSegment } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ButtonLink } from '@/components/ui/button';
import { AccountMenu } from '@/components/layout/account-menu';
import { useSession } from '@/components/providers/session-provider';

const navigation = [
  { href: '/designers', label: 'Designers' },
  { href: '/portfolios', label: 'Work' },
  { href: '/how-it-works', label: 'How it works' },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, status } = useSession();
  const segment = useSelectedLayoutSegment();
  const workspace = segment === '(app)';
  const designerWorkspace = workspace && user?.activeRole === 'DESIGNER';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-editorial ${
        scrolled || menuOpen
          ? 'border-b border-hairline bg-canvas/85 backdrop-blur-md'
          : 'border-b border-transparent'
      }`}
    >
      <div
        className={`shell flex items-center justify-between transition-all duration-500 ease-editorial ${
          scrolled ? 'h-16' : 'h-20'
        }`}
      >
        <Link
          href="/"
          className="font-display text-2xl font-semibold tracking-tight text-ink"
          aria-label="Inside - home"
        >
          Inside<span className="text-brand">.</span>
        </Link>

        {workspace ? null : (
          <nav className="hidden items-center gap-10 md:flex">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="label text-ink/70 transition-colors duration-300 hover:text-brand"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-5">
          {status === 'authenticated' && user ? (
            <>
              {workspace && !designerWorkspace ? null : (
                <Link
                  href={designerWorkspace ? `/designers/${user.id}` : '/dashboard'}
                  className="label hidden text-ink/70 transition-colors duration-300 hover:text-brand sm:block"
                >
                  {designerWorkspace ? 'Public profile' : 'Dashboard'}
                </Link>
              )}
              <AccountMenu user={user} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="label hidden text-ink/70 transition-colors duration-300 hover:text-brand sm:block"
              >
                Sign in
              </Link>
              <ButtonLink href="/register" className="hidden sm:inline-flex">
                Get started
              </ButtonLink>
            </>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="-mr-2 flex h-11 w-11 items-center justify-center md:hidden"
          >
            <span className="relative block h-3 w-6">
              <span
                className={`absolute left-0 block h-px w-6 bg-ink transition-all duration-300 ease-editorial ${
                  menuOpen ? 'top-1.5 rotate-45' : 'top-0'
                }`}
              />
              <span
                className={`absolute left-0 block h-px w-6 bg-ink transition-all duration-300 ease-editorial ${
                  menuOpen ? 'top-1.5 -rotate-45' : 'top-3'
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        hidden={!menuOpen}
        className="h-[calc(100dvh-4rem)] overflow-y-auto bg-canvas md:hidden"
      >
        {workspace ? null : (
          <nav className="shell flex flex-col pt-8">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border-b border-hairline py-6 font-display text-3xl font-semibold tracking-tight"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="shell mt-10 flex flex-col gap-4 pb-12">
          {status === 'authenticated' ? (
            <>
              <ButtonLink href="/dashboard" size="lg" fullWidth>
                Dashboard
              </ButtonLink>
              <ButtonLink
                href="/account"
                size="lg"
                variant="outline"
                fullWidth
              >
                Account
              </ButtonLink>
            </>
          ) : (
            <>
              <ButtonLink href="/register" size="lg" fullWidth>
                Get started
              </ButtonLink>
              <ButtonLink href="/login" size="lg" variant="outline" fullWidth>
                Sign in
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
