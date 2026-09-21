'use client';

import { useSelectedLayoutSegment } from 'next/navigation';

export function FooterGate({ children }: { children: React.ReactNode }) {
  return useSelectedLayoutSegment() === '(app)' ? null : children;
}
