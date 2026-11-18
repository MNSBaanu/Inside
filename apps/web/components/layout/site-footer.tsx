import Link from 'next/link';
import { NewsletterForm } from '@/components/features/home/newsletter-form';

export const columns = [
  {
    heading: 'Explore',
    links: [
      { href: '/explore', label: 'Explore' },
      { href: '/shop', label: 'Shop' },
      { href: '/open-projects', label: 'Open projects' },
      { href: '/how-it-works', label: 'How it works' },
      { href: '/contact', label: 'Contact us' },
    ],
  },
  {
    heading: 'For designers',
    links: [
      { href: '/register', label: 'Join Inside' },
      { href: '/verification', label: 'Verification' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { href: '/login', label: 'Sign in' },
      { href: '/register', label: 'Create account' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-brand-deep text-canvas">
      <div className="shell py-12 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1.4fr]">
          <div>
            <Link href="/" aria-label="Inside home" className="text-2xl font-semibold tracking-tight">
              Inside<span className="text-brand-soft">.</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-canvas/70">
              Good spaces start with a little inspiration.
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="text-sm font-medium">{column.heading}</h2>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={`${column.heading}-${link.label}`}>
                    <Link href={link.href} className="text-sm text-canvas/70 hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="min-w-0">
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-canvas/10 pt-6 text-xs text-canvas/60 sm:flex-row sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Inside. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/safety" className="hover:text-white">
              Trust &amp; safety
            </Link>
            <Link href="/how-it-works" className="hover:text-white">
              How Inside works
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
