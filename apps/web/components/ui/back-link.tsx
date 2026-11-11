'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function BackLink({ fallback }: { fallback: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() =>
        window.history.length > 1 ? router.back() : router.push(fallback)
      }
      className="inline-flex items-center gap-1 text-sm text-muted hover:text-brand"
    >
      <ChevronLeft aria-hidden className="h-4 w-4" />
      Back
    </button>
  );
}
