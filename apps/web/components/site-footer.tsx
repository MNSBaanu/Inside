import Link from 'next/link';

const columns = [
  {
    heading: 'Explore',
    links: [
      { href: '/designers', label: 'Designers' },
      { href: '/portfolios', label: 'Work' },
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
    <footer className="border-t border-hairline bg-sand">
      <div className="shell grid gap-12 py-20 md:grid-cols-[1.5fr_repeat(3,1fr)] md:py-28">
        <div className="max-w-xs">
          <p className="font-display text-2xl font-semibold tracking-tight">
            Inside<span className="text-clay">.</span>
          </p>
          <p className="mt-4 text-sm text-muted">
            Interior design, from first brief to final handover.
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.heading}>
            <p className="label">{column.heading}</p>
            <ul className="mt-5 space-y-3">
              {column.links.map((link) => (
                <li key={`${column.heading}-${link.href}-${link.label}`}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors duration-300 hover:text-clay"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="shell flex flex-col gap-3 border-t border-hairline py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} Inside</p>
        <p className="label">Interior design marketplace</p>
      </div>
    </footer>
  );
}
