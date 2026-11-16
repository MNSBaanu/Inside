import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cardSurface } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import { formatMoney } from '@/lib/utils/format';
import { isOptimizableImage } from '@/lib/utils/images';
import type { Product } from '@/lib/types';

export function ProductCard({
  product,
  sizes = '(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw',
}: {
  product: Product;
  sizes?: string;
}) {
  return (
    <Link
      href={`/shop/${product.id}`}
      className={cn(
        cardSurface,
        'group flex h-full flex-col p-3 transition-shadow duration-500 ease-editorial hover:shadow-lift',
      )}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-sand">
        <Image
          src={product.imageUrl}
          unoptimized={!isOptimizableImage(product.imageUrl)}
          alt={product.name}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04]"
        />
        {product.style ? (
          <span className="absolute left-3 top-3 rounded-pill bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-ink backdrop-blur">
            {product.style}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col px-1.5 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          {product.category}
        </p>
        <h3 className="mt-1 truncate text-base font-semibold transition-colors duration-300 group-hover:text-brand">
          {product.name}
        </h3>
        <p className="truncate text-sm text-muted">{product.sellerName}</p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <p className="whitespace-nowrap text-lg font-semibold">
            {formatMoney(product.price)}
          </p>
          <span
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-hairline transition-colors duration-300 group-hover:border-brand group-hover:bg-brand group-hover:text-white"
          >
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
