import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Interior design projects — Inside',
  description:
    'Explore finished interior projects published by designers on Inside.',
};

export default function PortfoliosSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
