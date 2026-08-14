import { SiteHeader } from '@/components/layout/site-header';

export type NavLink = {
  href: string;
  label: string;
};

type AppShellProps = {
  /** Route label kept for call sites; the header shows the brand only. */
  title?: string;
  links?: NavLink[];
  children: React.ReactNode;
};

export function AppShell({ links = [], children }: AppShellProps) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,_var(--surface-mist),_var(--background)_38%)]">
      {/* Colour behind the glass so blur has something to refract */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-24 -top-24 size-[32rem] rounded-full bg-[radial-gradient(circle,var(--brand-wash),transparent_65%)] blur-3xl" />
        <div className="absolute -right-32 top-1/3 size-[28rem] rounded-full bg-[radial-gradient(circle,oklch(0.9_0.05_85_/_0.5),transparent_65%)] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-[26rem] rounded-full bg-[radial-gradient(circle,oklch(0.88_0.05_200_/_0.35),transparent_65%)] blur-3xl" />
      </div>

      <SiteHeader variant="app" links={links} />
      <main className="mx-auto max-w-6xl px-4 py-8 md:py-10">{children}</main>
    </div>
  );
}
