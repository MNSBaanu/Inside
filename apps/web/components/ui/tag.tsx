import { cn } from '@/lib/utils/cn';

export function Tag({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'brand';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-semibold',
        tone === 'brand' ? 'bg-brand-soft text-brand-deep' : 'bg-sand text-ink',
        className,
      )}
    >
      {children}
    </span>
  );
}
