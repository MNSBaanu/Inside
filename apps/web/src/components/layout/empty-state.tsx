import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'surface-panel flex flex-col items-center gap-4 border-dashed px-6 py-12 text-center',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-12 place-items-center rounded-2xl border border-primary/15 bg-primary/[0.07] text-primary"
      >
        {icon ?? <Sparkles className="size-5" />}
      </span>
      <div className="space-y-2">
        <h2 className="font-heading text-xl tracking-tight">{title}</h2>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className={cn(buttonVariants(), 'mt-1')}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
