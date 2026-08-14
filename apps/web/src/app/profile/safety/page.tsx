import { AppShell } from '@/components/layout/app-shell';
import { SafetyPanel } from '@/components/trust/safety-panel';

export default function SafetyPage() {
  return (
    <AppShell title="Profile">
      <SafetyPanel />
    </AppShell>
  );
}
