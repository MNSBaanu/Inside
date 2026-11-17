'use client';

import { cn } from '@/lib/utils/cn';
import { cardSurface } from '@/components/ui/card';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { api, errorMessage } from '@/lib/api/client';
import { formatDate, formatMoney } from '@/lib/utils/format';
import { useApi } from '@/lib/api/use-api';
import type { MilestonePayment } from '@/lib/types';
import {
  loadStripe,
  type Stripe,
  type StripeCardElement,
} from '@stripe/stripe-js';
import { X } from 'lucide-react';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

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
  const [checkout, setCheckout] = useState<{
    paymentId: string;
    clientSecret: string;
    amount: string;
  } | null>(null);

  async function pay(paymentId: string) {
    setActionError(null);
    if (!stripePromise) {
      setActionError('Payments are not configured. Add the Stripe publishable key.');
      return;
    }
    setPending(paymentId);
    try {
      const intent = await api.post<{ clientSecret: string }>(
        `/payments/${paymentId}/checkout`,
      );
      const amount = formatMoney(
        data?.items.find((item) => item.id === paymentId)?.amount ?? 0,
      );
      setCheckout({ paymentId, clientSecret: intent.clientSecret, amount });
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

      {checkout && stripePromise ? (
        <CheckoutDialog
          stripePromise={stripePromise}
          clientSecret={checkout.clientSecret}
          amount={checkout.amount}
          onPaid={async (intentId) => {
            try {
              await api.patch(`/payments/${checkout.paymentId}/pay`, {
                paymentIntentId: intentId,
              });
              await reload();
            } catch (cause) {
              setActionError(errorMessage(cause));
            } finally {
              setCheckout(null);
            }
          }}
          onClose={() => setCheckout(null)}
        />
      ) : null}
    </div>
  );
}

function CheckoutDialog({
  stripePromise,
  clientSecret,
  amount,
  onPaid,
  onClose,
}: {
  stripePromise: Promise<Stripe | null>;
  clientSecret: string;
  amount: string;
  onPaid: (paymentIntentId: string) => Promise<void>;
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
  const cardRef = useRef<StripeCardElement | null>(null);
  const stripeRef = useRef<Stripe | null>(null);
  const [ready, setReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let element: StripeCardElement | undefined;
    stripePromise
      .then((stripe) => {
        if (!stripe || cancelled || !mountRef.current) return;
        stripeRef.current = stripe;
        element = stripe.elements().create('card', {
          hidePostalCode: true,
          disableLink: true,
          style: {
            base: {
              fontSize: '16px',
              color: '#1B2422',
              '::placeholder': { color: '#6C7471' },
            },
          },
        });
        cardRef.current = element;
        element.on('ready', () => setReady(true));
        element.mount(mountRef.current);
      })
      .catch((cause) => setMessage(errorMessage(cause)));
    return () => {
      cancelled = true;
      element?.destroy();
    };
  }, [stripePromise]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const stripe = stripeRef.current;
    const card = cardRef.current;
    if (!stripe || !card) return;
    setPaying(true);
    setMessage(null);
    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      { payment_method: { card } },
    );
    if (error) {
      setMessage(error.message ?? 'Payment failed. Try another card.');
      setPaying(false);
      return;
    }
    if (paymentIntent?.status === 'succeeded') {
      await onPaid(paymentIntent.id);
      return;
    }
    setMessage('Payment is processing. Refresh in a moment.');
    setPaying(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pay milestone"
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-card bg-white p-6 pt-12 shadow-lift"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close payment"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-sand"
        >
          <X aria-hidden className="h-5 w-5" />
        </button>
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <p className="font-display text-2xl font-semibold text-brand">{amount}</p>
          {message ? <ErrorNotice message={message} /> : null}
          <div className="rounded-xl border border-hairline bg-white p-4">
            <div ref={mountRef} />
          </div>
          <Button type="submit" disabled={!ready || paying}>
            {paying ? 'Paying…' : `Pay ${amount}`}
          </Button>
        </form>
      </div>
    </div>
  );
}
