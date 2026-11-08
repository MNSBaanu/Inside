import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore - Inside',
  description:
    'Browse finished interior projects for ideas, or find a verified interior designer and see their work.',
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
