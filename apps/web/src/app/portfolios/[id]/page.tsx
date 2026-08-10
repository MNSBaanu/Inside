import { AppShell } from '@/components/layout/app-shell';
import { PortfolioDetail } from '@/components/portfolios/portfolio-detail';

export default function PortfolioDetailPage() {
  return (
    <AppShell title="Portfolio">
      <PortfolioDetail />
    </AppShell>
  );
}
