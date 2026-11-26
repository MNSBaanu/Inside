'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils/cn';

const SHOW_AFTER_MS = 150;
const GIVE_UP_AFTER_MS = 10_000;

/** A thin bar at the top of the page while a page or its first data is loading. */
export function TopProgress() {
  const pathname = usePathname();
  const [navigating, setNavigating] = useState(false);
  const [requests, setRequests] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'running' | 'finishing'>('idle');

  useEffect(() => {
    const onLoading = (event: Event) =>
      setRequests((event as CustomEvent<number>).detail);
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const link = (event.target as Element | null)?.closest('a');
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;
      setNavigating(true);
    };
    window.addEventListener('inside:loading', onLoading);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('inside:loading', onLoading);
      document.removeEventListener('click', onClick);
    };
  }, []);

  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  useEffect(() => {
    if (!navigating) return;
    const timer = setTimeout(() => setNavigating(false), GIVE_UP_AFTER_MS);
    return () => clearTimeout(timer);
  }, [navigating]);

  const active = navigating || requests > 0;
  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => setPhase('running'), SHOW_AFTER_MS);
      return () => clearTimeout(timer);
    }
    setPhase((current) => (current === 'running' ? 'finishing' : current));
  }, [active]);

  useEffect(() => {
    if (phase !== 'finishing') return;
    const timer = setTimeout(() => setPhase('idle'), 400);
    return () => clearTimeout(timer);
  }, [phase]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5">
      <div
        className={cn(
          'h-full bg-brand ease-out',
          phase === 'idle' && 'w-0 opacity-0',
          phase === 'running' && 'w-4/5 opacity-100 transition-[width] duration-[8000ms]',
          phase === 'finishing' && 'w-full opacity-0 transition-[width,opacity] duration-300',
        )}
      />
    </div>
  );
}
