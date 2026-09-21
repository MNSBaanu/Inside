import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Open projects - Inside',
  description:
    'Interior design projects posted by clients on Inside. Designers can send a proposal with scope, timeline and stage fees.',
};

export default function OpenProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
