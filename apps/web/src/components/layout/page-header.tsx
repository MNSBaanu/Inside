import { cn } from '@/lib/utils';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-5', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-3">
          {eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.07] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-primary/70"
              />
              {eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading text-3xl tracking-tight md:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="text-base leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>
        ) : null}
      </div>
      <div
        aria-hidden="true"
        className="h-px bg-[linear-gradient(90deg,var(--border),transparent)]"
      />
    </div>
  );
}
