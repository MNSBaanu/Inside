import Link from 'next/link';
import { NewsletterForm } from '@/components/features/home/newsletter-form';

const columns = [
  {
    heading: 'Explore',
    links: [
      { href: '/designers', label: 'Designers' },
      { href: '/portfolios', label: 'Work' },
      { href: '/shop', label: 'Shop' },
      { href: '/open-projects', label: 'Open projects' },
      { href: '/how-it-works', label: 'How it works' },
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
    <footer className="border-t border-hairline bg-sand/60">
      <div className="shell py-10 md:py-12">
        <div className="grid items-center gap-8 border-b border-hairline pb-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <Link href="/" aria-label="Inside home" className="inline-block text-3xl font-semibold tracking-tight text-ink">
              Inside<span className="text-brand">.</span>
            </Link>
            <p className="mt-3 max-w-sm text-xl font-medium leading-snug tracking-tight text-ink sm:text-2xl">
              Good spaces start with a little inspiration.
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
              Discover your style, meet your designer, and make yourself at home.
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-hairline bg-canvas p-5 sm:p-6">
            <NewsletterForm />
          </div>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-8 pt-8 sm:grid-cols-3">
        {columns.map((column) => (
          <div key={column.heading}>
            <h2 className="text-sm font-semibold text-ink">{column.heading}</h2>
            <ul className="mt-3 space-y-1">
              {column.links.map((link) => (
                <li key={`${column.heading}-${link.href}-${link.label}`}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-10 items-center text-sm text-muted underline-offset-4 transition-colors hover:text-brand hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        </nav>
      </div>

      <div className="border-t border-brand/10 bg-brand-soft/50">
        <div className="shell flex flex-col gap-3 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Inside. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/safety" className="py-2 hover:text-brand hover:underline">Trust &amp; safety</Link>
            <Link href="/how-it-works" className="py-2 hover:text-brand hover:underline">How Inside works</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
