import { PortfolioDetail } from '@/components/features/portfolios/portfolio-detail';
import { AutoRefresh } from '@/components/layout/auto-refresh';
import { fetchPublic } from '@/lib/api/server-api';
import type { Portfolio } from '@/lib/types';

export default async function PortfolioDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const initial = await fetchPublic<{ portfolio: Portfolio }>(
    `/portfolios/${params.id}`,
  );

  return (
    <>
      <AutoRefresh />
      <PortfolioDetail id={params.id} initial={initial} />
    </>
  );
}
