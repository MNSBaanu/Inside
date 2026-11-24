import { PortfolioCard } from '@/components/features/portfolios/portfolio-card';
import type { Portfolio } from '@/lib/types';

export function PortfolioGrid({ items }: { items: Portfolio[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((portfolio) => (
        <PortfolioCard
          key={portfolio.id}
          portfolio={portfolio}
          sizes="(min-width: 1280px) 23vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
        />
      ))}
    </div>
  );
}
