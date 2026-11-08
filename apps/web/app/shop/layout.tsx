import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop - Inside',
  description:
    'Furniture, lighting, rugs and decor picked to go with your space. Save favourites to a moodboard.',
};

export default function ShopSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
