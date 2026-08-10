import Link from 'next/link';
import type { Portfolio } from '@/lib/api/types';
import { cn } from '@/lib/utils';

type PortfolioCardProps = {
  portfolio: Portfolio;
  href: string;
  className?: string;
};

export function PortfolioCard({ portfolio, href, className }: PortfolioCardProps) {
  const cover = portfolio.images[0]?.imageUrl;

  return (
    <Link
      href={href}
      className={cn(
        'group block overflow-hidden rounded-2xl border border-border/70 bg-card transition duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_40px_-28px_oklch(0.22_0.02_145_/_0.35)]',
        className,
      )}
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={portfolio.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading text-lg leading-snug tracking-tight">
            {portfolio.title}
          </h3>
          {!portfolio.isPublished ? (
            <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Draft
            </span>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {portfolio.style} · {portfolio.roomType}
        </p>
        <p className="text-xs text-muted-foreground">
          {portfolio.designer.name}
          {portfolio.budget != null
            ? ` · LKR ${portfolio.budget.toLocaleString()}`
            : ''}
        </p>
      </div>
    </Link>
  );
}
