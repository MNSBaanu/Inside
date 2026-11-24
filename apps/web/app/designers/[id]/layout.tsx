import type { Metadata } from 'next';
import { fetchPublic } from '@/lib/api/server-api';
import type { DesignerProfile } from '@/lib/types';

export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const params = await paramsPromise;
  const data = await fetchPublic<{ designer: DesignerProfile }>(
    `/designers/${params.id}`,
  );

  if (!data) {
    return { title: 'Designer - Inside' };
  }

  const { designer } = data;
  const description =
    designer.bio ??
    `${designer.name} takes on interior projects through Inside${
      designer.location ? ` in ${designer.location}` : ''
    }.`;

  return {
    title: `${designer.name} - Inside`,
    description,
    openGraph: {
      title: `${designer.name} - Inside`,
      description,
      type: 'profile',
      ...(designer.avatarUrl ? { images: [designer.avatarUrl] } : {}),
    },
  };
}

export default function DesignerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
