import {
  PortfolioDetail,
  type PortfolioExtras,
} from '@/components/features/portfolios/portfolio-detail';
import { AutoRefresh } from '@/components/layout/auto-refresh';
import { fetchPublic } from '@/lib/api/server-api';
import type { DesignerProfile, Paginated, Portfolio } from '@/lib/types';

async function loadExtras(portfolio: Portfolio): Promise<PortfolioExtras> {
  const designerId = portfolio.designer.id;
  const [profile, mine, similar] = await Promise.all([
    fetchPublic<{ designer: DesignerProfile }>(`/designers/${designerId}`),
    fetchPublic<Paginated<Portfolio>>(
      `/portfolios?designerId=${designerId}&pageSize=4`,
    ),
    portfolio.style
      ? fetchPublic<Paginated<Portfolio>>(
          `/portfolios?style=${encodeURIComponent(portfolio.style)}&pageSize=8`,
        )
      : null,
  ]);

  return {
    designer: profile?.designer ?? null,
    moreFromDesigner: (mine?.items ?? [])
      .filter((item) => item.id !== portfolio.id)
      .slice(0, 3),
    similar: (similar?.items ?? [])
      .filter(
        (item) => item.id !== portfolio.id && item.designer.id !== designerId,
      )
      .slice(0, 3),
  };
}

export default async function PortfolioDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const initial = await fetchPublic<{ portfolio: Portfolio }>(
    `/portfolios/${params.id}`,
  );
  const extras = initial ? await loadExtras(initial.portfolio) : null;

  return (
    <>
      <AutoRefresh />
      <PortfolioDetail id={params.id} initial={initial} extras={extras} />
    </>
  );
}
