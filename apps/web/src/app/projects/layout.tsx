import { AppShell } from '@/components/layout/app-shell';

const links = [{ href: '/projects', label: 'Projects' }];

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell title="Workspace" links={links}>
      {children}
    </AppShell>
  );
}
