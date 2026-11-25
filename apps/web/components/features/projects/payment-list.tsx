'use client';

import { cn } from '@/lib/utils/cn';
import { cardSurface } from '@/components/ui/card';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  EmptyState,
  ErrorNotice,
  Skeleton,
  SuccessNotice,
} from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { api, errorMessage } from '@/lib/api/client';
import { formatDate, formatMoney, titleCase } from '@/lib/utils/format';
import { useApi } from '@/lib/api/use-api';
import { paymentMethodLabel, type MilestonePayment } from '@/lib/types';
import {
  loadStripe,
  type Stripe,
  type StripeCardNumberElement,
} from '@stripe/stripe-js';
import { Lock, ReceiptText, ShieldCheck } from 'lucide-react';
import { Field, Input } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { InvoiceDialog } from '@/components/features/payments/invoice-dialog';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export function PaymentList({
  projectId,
  isClient,
  closed = false,
}: {
  projectId: string;
  isClient: boolean;
  /** A completed or cancelled project takes no more payments. */
  closed?: boolean;
}) {
  const { data, error, loading, reload } = useApi<{
    items: MilestonePayment[];
  }>(`/projects/${projectId}/payments`);

  const [actionError, setActionError] = useState<string | null>(null);
  const [paidMessage, setPaidMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<{
    paymentId: string;
    clientSecret: string;
    amount: string;
    label: string;
  } | null>(null);

  async function pay(paymentId: string) {
    setActionError(null);
    setPaidMessage(null);
    if (!stripePromise) {
      setActionError('Card payments are not available right now. Please try again later.');
      return;
    }
    setPending(paymentId);
    try {
      const intent = await api.post<{ clientSecret?: string; alreadyPaid?: boolean }>(
        `/payments/${paymentId}/checkout`,
      );
      const amount = formatMoney(
        data?.items.find((item) => item.id === paymentId)?.amount ?? 0,
      );
      if (intent.alreadyPaid || !intent.clientSecret) {
        await reload();
        setPaidMessage(`Your payment of ${amount} had already gone through. Nothing more to pay.`);
        return;
      }
      const stage = data?.items.find((item) => item.id === paymentId)?.stageName;
      setCheckout({
        paymentId,
        clientSecret: intent.clientSecret,
        amount,
        label: stage ? `${titleCase(stage)} stage milestone` : 'Project milestone',
      });
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
      {paidMessage ? <SuccessNotice message={paidMessage} /> : null}

      <ul className="mt-4 flex flex-col gap-4">
        {data.items.map((payment) => (
          <li
            key={payment.id}
            className={cn(cardSurface, 'flex flex-wrap items-center justify-between gap-4 p-6')}
          >
            <div>
              {payment.stageName ? (
                <p className="text-sm font-semibold text-ink">
                  {titleCase(payment.stageName)} stage
                </p>
              ) : null}
              <p className="font-display text-2xl font-semibold text-brand">
                {formatMoney(payment.amount)}
              </p>
              <p className="mt-1 text-sm text-muted">
                {payment.paidAt
                  ? `Paid ${formatDate(payment.paidAt)}${payment.method !== 'CARD' ? ` by ${paymentMethodLabel[payment.method].toLowerCase()}` : ''}`
                  : 'Not paid yet'}
                {payment.releasedAt
                  ? ` · Released ${formatDate(payment.releasedAt)}`
                  : ''}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <StatusBadge status={payment.status} />
              {payment.status !== 'PENDING' ? (
                <Button size="sm" variant="outline" onClick={() => setInvoiceId(payment.id)}>
                  <ReceiptText aria-hidden className="h-4 w-4" />
                  Invoice
                </Button>
              ) : null}
              {isClient && !closed && payment.status === 'PENDING' ? (
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

      {invoiceId ? (
        <InvoiceDialog paymentId={invoiceId} onClose={() => setInvoiceId(null)} />
      ) : null}

      {checkout && stripePromise ? (
        <CheckoutDialog
          stripePromise={stripePromise}
          clientSecret={checkout.clientSecret}
          amount={checkout.amount}
          label={checkout.label}
          onPaid={async (intentId) => {
            try {
              const result = await api.patch<{ payment: MilestonePayment }>(
                `/payments/${checkout.paymentId}/pay`,
                { paymentIntentId: intentId },
              );
              setPaidMessage(
                result?.payment?.status === 'REFUNDED'
                  ? `This project was cancelled while you were paying, so your ${checkout.amount} payment was refunded to your card.`
                  : `Payment of ${checkout.amount} received. The designer can start this stage.`,
              );
            } catch (cause) {
              setActionError(errorMessage(cause));
            } finally {
              setCheckout(null);
              // Refresh either way: the card was charged, and the list picks
              // up a payment the confirmation above failed to record.
              await reload();
            }
          }}
          onClose={() => setCheckout(null)}
        />
      ) : null}
    </div>
  );
}

type CardField = 'cardNumber' | 'cardExpiry' | 'cardCvc';

const CARD_FIELDS: { key: CardField; label: string }[] = [
  { key: 'cardNumber', label: 'Card number' },
  { key: 'cardExpiry', label: 'Expiry date' },
  { key: 'cardCvc', label: 'CVC' },
];

const fieldBox =
  'rounded-card border border-hairline bg-surface px-4 py-3.5 transition-colors duration-200 [&.StripeElement--focus]:border-brand [&.StripeElement--invalid]:border-error';

function CheckoutDialog({
  stripePromise,
  clientSecret,
  amount,
  label,
  onPaid,
  onClose,
}: {
  stripePromise: Promise<Stripe | null>;
  clientSecret: string;
  amount: string;
  label: string;
  onPaid: (paymentIntentId: string) => Promise<void>;
  onClose: () => void;
}) {
  const mounts = useRef<Record<CardField, HTMLDivElement | null>>({
    cardNumber: null,
    cardExpiry: null,
    cardCvc: null,
  });
  const numberRef = useRef<StripeCardNumberElement | null>(null);
  const stripeRef = useRef<Stripe | null>(null);
  const [name, setName] = useState('');
  const [complete, setComplete] = useState<Record<CardField, boolean>>({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<CardField, string>>>({});
  const [ready, setReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const created: { destroy: () => void }[] = [];
    stripePromise
      .then((stripe) => {
        if (!stripe || cancelled) return;
        stripeRef.current = stripe;
        const elements = stripe.elements({
          fonts: [
            {
              cssSrc:
                'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500&display=swap',
            },
          ],
        });
        const style = {
          base: {
            fontFamily: '"Inter Tight", system-ui, sans-serif',
            fontSize: '16px',
            color: '#1B2422',
            '::placeholder': { color: '#9AA09D' },
          },
          invalid: { color: '#B3261E' },
        };
        const track =
          (key: CardField) =>
          (event: { complete: boolean; error?: { message?: string } }) => {
            setComplete((current) => ({ ...current, [key]: event.complete }));
            setFieldErrors((current) => ({ ...current, [key]: event.error?.message }));
          };
        const { cardNumber, cardExpiry, cardCvc } = mounts.current;
        if (!cardNumber || !cardExpiry || !cardCvc) return;

        const number = elements.create('cardNumber', {
          style,
          showIcon: true,
          disableLink: true,
        });
        number.on('change', track('cardNumber'));
        number.on('ready', () => setReady(true));
        number.mount(cardNumber);
        numberRef.current = number;

        const expiry = elements.create('cardExpiry', { style });
        expiry.on('change', track('cardExpiry'));
        expiry.mount(cardExpiry);

        const cvc = elements.create('cardCvc', { style, placeholder: '123' });
        cvc.on('change', track('cardCvc'));
        cvc.mount(cardCvc);

        created.push(number, expiry, cvc);
      })
      .catch((cause) => setMessage(errorMessage(cause)));
    return () => {
      cancelled = true;
      created.forEach((element) => element.destroy());
    };
  }, [stripePromise]);

  const canPay =
    ready && !paying && name.trim().length > 1 && Object.values(complete).every(Boolean);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const stripe = stripeRef.current;
    const card = numberRef.current;
    if (!stripe || !card || !canPay) return;
    setPaying(true);
    setMessage(null);
    let result: Awaited<ReturnType<Stripe['confirmCardPayment']>>;
    try {
      result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card, billing_details: { name: name.trim() } },
      });
    } catch {
      // Lost connection mid-payment: the card may or may not have been charged.
      setMessage(
        'We lost the connection while paying. Close this and check your payments before trying again.',
      );
      setPaying(false);
      return;
    }
    const { error, paymentIntent } = result;
    if (error) {
      setMessage(error.message ?? 'Payment failed. Try another card.');
      setPaying(false);
      return;
    }
    if (paymentIntent?.status === 'succeeded') {
      await onPaid(paymentIntent.id);
      return;
    }
    setMessage('Your payment is processing. It will show here once your bank confirms it.');
    setPaying(false);
  }

  return (
    <Modal title="Pay milestone" description={label} onClose={paying ? () => {} : onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex items-center justify-between rounded-lg bg-brand-soft px-4 py-3">
          <span className="text-sm text-brand-deep">Amount due</span>
          <span className="font-display text-2xl font-semibold text-brand-deep">{amount}</span>
        </div>

        {message ? <ErrorNotice message={message} /> : null}

        <Field label="Name on card" htmlFor="card-name">
          <Input
            id="card-name"
            autoComplete="cc-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="As shown on the card"
          />
        </Field>

        {CARD_FIELDS.slice(0, 1).map(({ key, label: fieldLabel }) => (
          <div key={key}>
            <p className="ui-label mb-2 text-ink/70">{fieldLabel}</p>
            <div ref={(node) => { mounts.current[key] = node; }} className={fieldBox} />
            {fieldErrors[key] ? <p className="mt-1.5 text-sm text-error">{fieldErrors[key]}</p> : null}
          </div>
        ))}

        <div className="grid grid-cols-2 gap-4">
          {CARD_FIELDS.slice(1).map(({ key, label: fieldLabel }) => (
            <div key={key}>
              <p className="ui-label mb-2 text-ink/70">{fieldLabel}</p>
              <div ref={(node) => { mounts.current[key] = node; }} className={fieldBox} />
              {fieldErrors[key] ? <p className="mt-1.5 text-sm text-error">{fieldErrors[key]}</p> : null}
            </div>
          ))}
        </div>

        {!ready ? <Skeleton className="h-4 w-40" /> : null}

        <Button type="submit" size="lg" fullWidth disabled={!canPay}>
          <Lock aria-hidden className="h-4 w-4" />
          {paying ? 'Paying…' : `Pay ${amount}`}
        </Button>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
          <ShieldCheck aria-hidden className="h-3.5 w-3.5" />
          Secure card payment. Inside holds it until you approve the stage.
        </p>
      </form>
    </Modal>
  );
}