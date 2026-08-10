'use client';

import { useEffect, useRef } from 'react';

/** Repeats `callback` on an interval, pausing while the tab is hidden. */
export function usePoll(callback: () => void, intervalMs: number) {
  const latest = useRef(callback);
  latest.current = callback;

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const start = () => {
      if (timer) return;
      timer = setInterval(() => latest.current(), intervalMs);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stop();
      } else {
        latest.current();
        start();
      }
    };

    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [intervalMs]);
}
