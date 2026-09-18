import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Interior designers - Inside',
  description:
    'Browse verified interior designers on Inside, filter by location and see their published work.',
};

export default function DesignersSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
