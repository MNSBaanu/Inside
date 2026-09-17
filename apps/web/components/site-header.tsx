'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const navigation = [
  { href: '/designers', label: 'Designers' },
  { href: '/portfolios', label: 'Work' },
  { href: '/how-it-works', label: 'How it works' },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

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
          className="font-display text-xl tracking-tight text-ink"
          aria-label="Inside — home"
        >
          Inside
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="label text-ink/70 transition-colors duration-300 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="label hidden text-ink/70 transition-colors duration-300 hover:text-ink sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="label hidden bg-ink px-5 py-3 text-canvas transition-opacity duration-300 hover:opacity-85 sm:block"
          >
            Get started
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="-mr-2 flex h-10 w-10 items-center justify-center md:hidden"
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
        <nav className="shell flex flex-col pt-8">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-b border-hairline py-6 font-display text-3xl tracking-tight"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="shell mt-10 flex flex-col gap-4 pb-12">
          <Link
            href="/register"
            className="label bg-ink px-5 py-4 text-center text-canvas"
          >
            Get started
          </Link>
          <Link href="/login" className="label py-4 text-center text-ink">
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}
