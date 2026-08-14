import { AppShell } from '@/components/layout/app-shell';
import { NotificationsPage } from '@/components/layout/notifications-page';

export default function NotificationsRoute() {
  return (
    <AppShell title="Notifications">
      <NotificationsPage />
    </AppShell>
  );
}
