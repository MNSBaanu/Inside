import { AppShell } from '@/components/layout/app-shell';

const links = [
  { href: '/designer', label: 'Portfolios' },
  { href: '/designer/requests', label: 'Requests' },
  { href: '/designer/verification', label: 'Verification' },
  { href: '/designer/portfolios/new', label: 'New' },
];

export default function DesignerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell title="Designer" links={links}>
      {children}
    </AppShell>
  );
}
