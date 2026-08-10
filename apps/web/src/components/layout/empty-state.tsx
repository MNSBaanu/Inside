import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
};

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'surface-panel flex flex-col items-start gap-3 px-6 py-10',
        className,
      )}
    >
      <h2 className="font-heading text-xl tracking-tight">{title}</h2>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className={cn(buttonVariants(), 'mt-1')}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
