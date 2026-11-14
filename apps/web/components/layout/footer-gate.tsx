'use client';

import { useSelectedLayoutSegment } from 'next/navigation';

export function FooterGate({ children }: { children: React.ReactNode }) {
  const segment = useSelectedLayoutSegment();
  return segment === '(app)' || segment === null ? null : children;
}
