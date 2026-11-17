'use client';

import { ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { SaveToMoodboard } from '@/components/features/shop/save-to-moodboard';
import { ShopDiscount } from '@/components/features/shop/shop-discount';
import { Tag } from '@/components/ui/tag';
import { ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { formatMoney } from '@/lib/utils/format';
import { buildQuery, useApi } from '@/lib/api/use-api';
import { ProductCard } from '@/components/features/shop/product-card';
import type { Paginated, Product } from '@/lib/types';
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
      <div className="shell page">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,26rem)_1fr]">
          <Skeleton className="aspect-square w-full max-w-md" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="shell page">
        <ErrorNotice message={error ?? 'Product not found'} />
        <Link href="/shop" className="link-underline mt-6 inline-block">
          Back to the shop
        </Link>
      </div>
    );
  }

  const { product } = data;

  return (
    <div className="shell page">
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
            <Tag>{product.category}</Tag>
            {product.style ? <Tag tone="brand">{product.style}</Tag> : null}
          </div>
          <h1 className="mt-6 font-display text-title font-semibold">
            {product.name}
          </h1>
          <p className="mt-4 text-2xl font-semibold">
            {formatMoney(product.price)}
          </p>
          <ShopDiscount price={product.price} slug={product.slug} />
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
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-base font-semibold text-canvas transition-all duration-300 ease-editorial hover:bg-brand-deep"
              >
                Buy from seller
              </a>
            )}
            <SaveToMoodboard product={product} />
          </div>
        </div>
      </div>

      {product.style ? <MoreInStyle product={product} /> : null}
    </div>
  );
}

function MoreInStyle({ product }: { product: Product }) {
  const { data } = useApi<Paginated<Product>>(
    `/products${buildQuery({ style: product.style ?? '', pageSize: 5 })}`,
  );
  const items = (data?.items ?? []).filter((item) => item.id !== product.id).slice(0, 4);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="more-in-style" className="mt-20 border-t border-hairline pt-12">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="more-in-style" className="font-display text-2xl font-semibold">
          More in {product.style}
        </h2>
        <Link
          href={`/shop?style=${encodeURIComponent(product.style ?? '')}`}
          className="text-sm font-semibold text-brand hover:underline"
        >
          See all
        </Link>
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </section>
  );
}
