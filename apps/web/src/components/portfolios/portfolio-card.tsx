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
        'group block overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/40',
        className,
      )}
    >
      <div className="aspect-[4/3] bg-muted">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={portfolio.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="space-y-1 p-3">
        <h3 className="font-medium leading-snug tracking-tight">{portfolio.title}</h3>
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
