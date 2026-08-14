import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  href?: string;
  className?: string;
};

function Body({ label, value, hint, icon }: Omit<StatCardProps, 'href'>) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        {icon ? (
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-xl border border-primary/15 bg-primary/[0.07] text-primary"
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className="font-heading text-4xl tabular-nums tracking-tight">
        {value}
      </p>
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
    </>
  );
}

export function StatCard({ href, className, ...rest }: StatCardProps) {
  const shell = 'surface-panel space-y-2 p-6';

  if (!href) {
    return (
      <div className={cn(shell, className)}>
        <Body {...rest} />
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        shell,
        'group block transition-all hover:-translate-y-0.5 hover:shadow-[0_26px_64px_-34px_oklch(0.22_0.02_145_/_0.55)]',
        className,
      )}
    >
      <Body {...rest} />
      <span className="inline-flex items-center gap-1 pt-2 text-sm text-primary">
        Open
        <ArrowRight
          aria-hidden="true"
          className="size-3.5 transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}
