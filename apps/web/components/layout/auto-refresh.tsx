'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { REFRESH_INTERVAL_MS } from '@/lib/api/use-api';

export function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) router.refresh();
    };
    const timer = setInterval(refresh, REFRESH_INTERVAL_MS);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [router]);

  return null;
}
