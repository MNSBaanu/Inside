'use client';

import { Check, Copy, Tag as TagIcon } from 'lucide-react';
import { useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { SHOP_DISCOUNT, discountedPrice } from '@/lib/shop';
import { formatMoney } from '@/lib/utils/format';

export function ShopDiscount({ price }: { price: number }) {
  const { user } = useSession();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(SHOP_DISCOUNT.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-6 max-w-xl rounded-card bg-brand-soft p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-brand-deep">
        <TagIcon aria-hidden className="h-4 w-4" />
        Inside member price
      </p>
      <p className="mt-2 flex flex-wrap items-baseline gap-x-3">
        <span className="text-2xl font-semibold text-brand-deep">
          {formatMoney(discountedPrice(price))}
        </span>
        <span className="text-sm text-muted line-through">{formatMoney(price)}</span>
        <span className="text-sm text-brand-deep">{SHOP_DISCOUNT.percent}% off</span>
      </p>
      <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink">
        Use code
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy discount code ${SHOP_DISCOUNT.code}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-brand bg-surface px-2.5 py-1 font-mono font-semibold text-brand-deep transition-colors hover:bg-brand hover:text-canvas"
        >
          {SHOP_DISCOUNT.code}
          {copied ? (
            <Check aria-hidden className="h-3.5 w-3.5" />
          ) : (
            <Copy aria-hidden className="h-3.5 w-3.5" />
          )}
        </button>
        at checkout on the seller&apos;s site.
        <span role="status" className="sr-only">
          {copied ? 'Code copied' : ''}
        </span>
      </p>
    </div>
  );
}
