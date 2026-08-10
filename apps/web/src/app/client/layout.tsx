import { AppShell } from '@/components/layout/app-shell';

const links = [
  { href: '/client', label: 'Discover' },
  { href: '/client/moodboards', label: 'Moodboards' },
  { href: '/client/briefs', label: 'Briefs' },
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
