'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const navigation = [
  { href: '/designers', label: 'Designers' },
  { href: '/portfolios', label: 'Work' },
  { href: '/how-it-works', label: 'How it works' },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-editorial ${
        scrolled
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
            className="label bg-ink px-5 py-3 text-canvas transition-opacity duration-300 hover:opacity-85"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
