import { AppShell } from '@/components/layout/app-shell';

export default function DesignerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell title="Designer">{children}</AppShell>;
}
