'use client';

import { useEffect, useRef } from 'react';

export function ScrollScale({
  children,
  from,
  to,
  mode,
  className = '',
}: {
  children: React.ReactNode;
  from: number;
  to: number;
  mode: 'enter' | 'exit';
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const height = window.innerHeight;
      const raw =
        mode === 'exit'
          ? window.scrollY / height
          : (height - node.getBoundingClientRect().top) / height;
      const progress = Math.min(1, Math.max(0, raw));
      node.style.transform = `scale(${from + (to - from) * progress})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [from, to, mode]);

  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}
