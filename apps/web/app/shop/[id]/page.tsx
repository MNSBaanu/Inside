'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SaveToMoodboard } from '@/components/features/shop/save-to-moodboard';
import { Badge } from '@/components/ui/badge';
import { ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { formatMoney } from '@/lib/utils/format';
import { useApi } from '@/lib/api/use-api';
import type { Product } from '@/lib/types';
import { isOptimizableImage } from '@/lib/utils/images';

const PLACEHOLDER_SELLER_URL = /^https?:\/\/(www\.)?example\.com(\/|$)/;

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data, error, loading } = useApi<{ product: Product }>(
    `/products/${params.id}`,
  );

  if (loading) {
    return (
      <div className="shell py-32 md:py-40">
        <div className="grid gap-12 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="shell py-32 md:py-40">
        <ErrorNotice message={error ?? 'Product not found'} />
        <Link href="/shop" className="link-underline mt-6 inline-block">
          Back to the shop
        </Link>
      </div>
    );
  }

  const { product } = data;

  return (
    <div className="shell py-32 md:py-40">
      <Link href="/shop" className="text-sm text-muted hover:text-brand">
        ← All products
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-square overflow-hidden rounded-card bg-sand shadow-card">
          <Image
            src={product.imageUrl}
            unoptimized={!isOptimizableImage(product.imageUrl)}
            alt={product.name}
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col">
          <div className="flex flex-wrap gap-2">
            <Badge>{product.category}</Badge>
            {product.style ? <Badge tone="brand">{product.style}</Badge> : null}
          </div>
          <h1 className="mt-6 font-display text-section font-semibold">
            {product.name}
          </h1>
          <p className="mt-4 text-2xl font-semibold">
            {formatMoney(product.price)}
          </p>
          <p className="mt-6 max-w-xl text-lg text-muted">
            {product.description}
          </p>
          <p className="mt-6 text-sm text-muted">
            Sold by <span className="font-semibold text-ink">{product.sellerName}</span>
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-hairline pt-8">
            {PLACEHOLDER_SELLER_URL.test(product.sellerUrl) ? null : (
              <a
                href={product.sellerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-pill bg-brand px-6 py-3 text-base font-semibold text-canvas transition-all duration-300 ease-editorial hover:bg-brand-deep hover:shadow-lift"
              >
                Visit seller
              </a>
            )}
            <SaveToMoodboard product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
