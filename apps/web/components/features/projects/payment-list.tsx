'use client';

import { cn } from '@/lib/utils/cn';
import { cardSurface } from '@/components/ui/card';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { api, errorMessage } from '@/lib/api/client';
import { formatDate, formatMoney } from '@/lib/utils/format';
import { useApi } from '@/lib/api/use-api';
import type { MilestonePayment } from '@/lib/types';
import { loadStripe, type Stripe, type StripeEmbeddedCheckout } from '@stripe/stripe-js';
import { X } from 'lucide-react';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
let checkoutQueue: Promise<void> = Promise.resolve();

export function PaymentList({
  projectId,
  isClient,
}: {
  projectId: string;
  isClient: boolean;
}) {
  const { data, error, loading, reload } = useApi<{
    items: MilestonePayment[];
  }>(`/projects/${projectId}/payments`);

  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const returnedPayment = searchParams.get('payment');
  const sessionId = searchParams.get('session_id');
  const confirming = useRef(false);

  useEffect(() => {
    if (!returnedPayment || !sessionId || confirming.current) return;
    confirming.current = true;
    api
      .patch(`/payments/${returnedPayment}/pay`, { sessionId })
      .then(() => reload())
      .catch((cause) => setActionError(errorMessage(cause)))
      .finally(() => router.replace(`/projects/${projectId}`));
  }, [returnedPayment, sessionId, projectId, reload, router]);

  async function pay(paymentId: string) {
    setActionError(null);
    if (!stripePromise) {
      setActionError('Payments are not configured. Add the Stripe publishable key.');
      return;
    }
    setPending(paymentId);
    try {
      const data = await api.post<{ clientSecret: string }>(
        `/payments/${paymentId}/checkout`,
      );
      setClientSecret(data.clientSecret);
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setPending(null);
    }
  }

  if (loading) return <Skeleton className="h-40" />;
  if (error) return <ErrorNotice message={error} />;
  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        title="No milestone payments yet."
        description="Payments appear once stages with fees are created."
      />
    );
  }

  return (
    <div>
      <p className="rounded-card bg-sand p-4 text-sm text-ink">
        Pay each milestone before its stage starts. The platform holds the
        money and releases it to the designer when you approve the stage.
      </p>
      {actionError ? <ErrorNotice message={actionError} /> : null}
      {returnedPayment && sessionId ? (
        <p role="status" className="text-sm text-muted">
          Confirming your payment…
        </p>
      ) : null}

      <ul className="mt-4 flex flex-col gap-4">
        {data.items.map((payment) => (
          <li
            key={payment.id}
            className={cn(cardSurface, 'flex flex-wrap items-center justify-between gap-4 p-6')}
          >
            <div>
              <p className="font-display text-2xl font-semibold text-brand">
                {formatMoney(payment.amount)}
              </p>
              <p className="mt-1 text-sm text-muted">
                {payment.paidAt
                  ? `Paid ${formatDate(payment.paidAt)}`
                  : 'Not paid yet'}
                {payment.releasedAt
                  ? ` · Released ${formatDate(payment.releasedAt)}`
                  : ''}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <StatusBadge status={payment.status} />
              {isClient && payment.status === 'PENDING' ? (
                <Button
                  size="sm"
                  disabled={pending === payment.id}
                  onClick={() => pay(payment.id)}
                >
                  Pay now
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {clientSecret && stripePromise ? (
        <CheckoutDialog
          stripePromise={stripePromise}
          clientSecret={clientSecret}
          onClose={() => setClientSecret(null)}
        />
      ) : null}
    </div>
  );
}

function CheckoutDialog({
  stripePromise,
  clientSecret,
  onClose,
}: {
  stripePromise: Promise<Stripe | null>;
  clientSecret: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const mountRef = useRef<HTMLDivElement>(null);
  const [mountError, setMountError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let checkout: StripeEmbeddedCheckout | undefined;
    checkoutQueue = checkoutQueue.then(async () => {
      if (cancelled) return;
      try {
        const stripe = await stripePromise;
        if (!stripe || cancelled || !mountRef.current) return;
        checkout = await stripe.initEmbeddedCheckout({
          fetchClientSecret: async () => clientSecret,
        });
        checkout.mount(mountRef.current);
      } catch (cause) {
        setMountError(errorMessage(cause));
      }
    });
    return () => {
      cancelled = true;
      checkoutQueue = checkoutQueue.then(() => checkout?.destroy());
    };
  }, [stripePromise, clientSecret]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pay milestone"
        className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-card bg-white p-4 pt-12 shadow-lift"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close checkout"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-sand"
        >
          <X aria-hidden className="h-5 w-5" />
        </button>
        {mountError ? <ErrorNotice message={mountError} /> : null}
        <div ref={mountRef} />
      </div>
    </div>
  );
}
