import { PortfolioDetail } from '@/components/features/portfolios/portfolio-detail';
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

  return <PortfolioDetail id={params.id} initial={initial} />;
}
