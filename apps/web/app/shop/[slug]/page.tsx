'use client';

import { ChevronLeft } from 'lucide-react';
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
  params: { slug: string };
}) {
  const { data, error, loading } = useApi<{ product: Product }>(
    `/products/${params.slug}`,
  );

  if (loading) {
    return (
      <div className="shell pb-32 pt-24 md:pb-40 md:pt-28">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,26rem)_1fr]">
          <Skeleton className="aspect-square w-full max-w-md" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="shell pb-32 pt-24 md:pb-40 md:pt-28">
        <ErrorNotice message={error ?? 'Product not found'} />
        <Link href="/shop" className="link-underline mt-6 inline-block">
          Back to the shop
        </Link>
      </div>
    );
  }

  const { product } = data;

  return (
    <div className="shell pb-32 pt-24 md:pb-40 md:pt-28">
      <Link
        href="/shop"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-brand"
      >
        <ChevronLeft aria-hidden className="h-4 w-4" />
        All products
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-14">
        <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-card bg-sand shadow-card">
          <Image
            src={product.imageUrl}
            unoptimized={!isOptimizableImage(product.imageUrl)}
            alt={product.name}
            fill
            priority
            sizes="(min-width: 640px) 28rem, 100vw"
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
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-base font-semibold text-canvas transition-all duration-300 ease-editorial hover:bg-brand-deep hover:shadow-lift"
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
