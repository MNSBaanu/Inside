import { AppShell } from '@/components/layout/app-shell';

const links = [
  { href: '/client', label: 'Discover' },
  { href: '/client/favourites', label: 'Favourites' },
];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell title="Client" links={links}>
      {children}
    </AppShell>
  );
}
