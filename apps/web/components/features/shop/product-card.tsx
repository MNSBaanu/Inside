import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
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
    <Link href={`/shop/${product.id}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-card bg-sand shadow-card">
        <Image
          src={product.imageUrl}
          unoptimized={!isOptimizableImage(product.imageUrl)}
          alt={product.name}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04]"
        />
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold transition-colors duration-300 group-hover:text-brand">
            {product.name}
          </h3>
          <p className="mt-0.5 truncate text-sm text-muted">
            {product.sellerName}
          </p>
        </div>
        <p className="whitespace-nowrap font-semibold">
          {formatMoney(product.price)}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge>{product.category}</Badge>
        {product.style ? <Badge tone="brand">{product.style}</Badge> : null}
      </div>
    </Link>
  );
}
