import { cn } from '@/lib/utils';

type MasonryGridProps = {
  children: React.ReactNode;
  className?: string;
};

export function MasonryGrid({ children, className }: MasonryGridProps) {
  return (
    <div
      className={cn(
        'columns-1 gap-5 [column-fill:_balance] sm:columns-2 lg:columns-3',
        '[&>*]:mb-5 [&>*]:break-inside-avoid',
        className,
      )}
    >
      {children}
    </div>
  );
}
