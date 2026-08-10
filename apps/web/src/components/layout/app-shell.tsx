import { SiteHeader } from '@/components/layout/site-header';

export type NavLink = {
  href: string;
  label: string;
};

type AppShellProps = {
  title: string;
  links?: NavLink[];
  children: React.ReactNode;
};

export function AppShell({ title, links = [], children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--brand-wash),_transparent_55%),var(--background)]">
      <SiteHeader variant="app" title={title} links={links} />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
