import { AppShell } from '@/components/layout/app-shell';

const links = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/verifications', label: 'Verification' },
  { href: '/admin/reports', label: 'Reports' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell title="Admin" links={links}>
      {children}
    </AppShell>
  );
}
