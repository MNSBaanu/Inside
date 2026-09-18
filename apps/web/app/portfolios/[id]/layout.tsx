import type { Metadata } from 'next';
import { fetchPublic } from '@/lib/server-api';
import type { Portfolio } from '@/lib/types';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const data = await fetchPublic<{ portfolio: Portfolio }>(
    `/portfolios/${params.id}`,
  );

  if (!data) {
    return { title: 'Project - Inside' };
  }

  const { portfolio } = data;
  const description =
    portfolio.description ??
    `${portfolio.title} by ${portfolio.designer.name} on Inside.`;
  const image = portfolio.images[0]?.imageUrl;

  return {
    title: `${portfolio.title} - Inside`,
    description,
    openGraph: {
      title: `${portfolio.title} - Inside`,
      description,
      type: 'article',
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
