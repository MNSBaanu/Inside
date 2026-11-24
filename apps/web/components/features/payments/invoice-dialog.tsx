'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/status-badge';
import { useApi } from '@/lib/api/use-api';
import { formatDate, formatMoney, titleCase } from '@/lib/utils/format';
import { safeHref } from '@/lib/utils/url';
import { paymentMethodLabel, type PaymentMethod } from '@/lib/types';

type Invoice = {
  number: string;
  status: string;
  project: { id: string; title: string };
  stage: string;
  client: string;
  designer: string;
  amount: number;
  amountRefunded: number;
  currency: string;
  paidAt: string | null;
  releasedAt: string | null;
  method: PaymentMethod;
  reference: string | null;
  proofUrl: string | null;
  card: { brand: string; last4: string } | null;
  billingName: string | null;
};

/** The invoice for a paid milestone. */
export function InvoiceDialog({
  paymentId,
  onClose,
}: {
  paymentId: string;
  onClose: () => void;
}) {
  const { data, error, loading } = useApi<{ invoice: Invoice }>(
    `/payments/${paymentId}/invoice`,
  );
  const invoice = data?.invoice;

  return (
    <Modal title="Invoice" onClose={onClose}>
      {loading ? <Skeleton className="h-80" /> : null}
      {error ? <ErrorNotice message={error} /> : null}
      {invoice ? (
        <div>
          <div className="print-area">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-brand">INSIDE</p>
                <p className="mt-1 font-display text-2xl font-semibold">Invoice</p>
                <p className="mt-1 text-sm text-muted">{invoice.number}</p>
              </div>
              <div className="text-right">
                <StatusBadge status={invoice.status} />
                <p className="mt-2 text-sm text-muted">
                  Paid {invoice.paidAt ? formatDate(invoice.paidAt) : '-'}
                </p>
              </div>
            </div>

            <dl className="mt-6 grid gap-4 border-y border-hairline py-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Billed to</dt>
                <dd className="mt-0.5 font-semibold">{invoice.billingName ?? invoice.client}</dd>
              </div>
              <div>
                <dt className="text-muted">Designer</dt>
                <dd className="mt-0.5 font-semibold">{invoice.designer}</dd>
              </div>
              <div>
                <dt className="text-muted">Project</dt>
                <dd className="mt-0.5 font-semibold">{invoice.project.title}</dd>
              </div>
              {invoice.card || invoice.method !== 'CARD' ? (
                <div>
                  <dt className="text-muted">Paid with</dt>
                  <dd className="mt-0.5 font-semibold">
                    {invoice.card
                      ? `${titleCase(invoice.card.brand)} •••• ${invoice.card.last4}`
                      : paymentMethodLabel[invoice.method]}
                  </dd>
                  {invoice.reference ? (
                    <dd className="mt-0.5 text-muted">Ref. {invoice.reference}</dd>
                  ) : null}
                  {invoice.proofUrl ? (
                    <dd className="no-print mt-0.5">
                      <a
                        href={safeHref(invoice.proofUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand underline underline-offset-4"
                      >
                        View proof of payment
                      </a>
                    </dd>
                  ) : null}
                </div>
              ) : null}
            </dl>

            <table className="mt-5 w-full text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th className="pb-2 font-normal">Description</th>
                  <th className="pb-2 text-right font-normal">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-hairline">
                  <td className="py-3">
                    {titleCase(invoice.stage)} stage milestone
                    <span className="block text-muted">{invoice.project.title}</span>
                  </td>
                  <td className="py-3 text-right font-semibold">
                    {formatMoney(invoice.amount)}
                  </td>
                </tr>
                {invoice.amountRefunded > 0 ? (
                  <tr className="border-t border-hairline">
                    <td className="py-3">Refunded</td>
                    <td className="py-3 text-right font-semibold text-error">
                      − {formatMoney(invoice.amountRefunded)}
                    </td>
                  </tr>
                ) : null}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-ink/80">
                  <td className="pt-3 font-semibold">Total paid ({invoice.currency})</td>
                  <td className="pt-3 text-right font-display text-xl font-semibold text-brand">
                    {formatMoney(invoice.amount - invoice.amountRefunded)}
                  </td>
                </tr>
              </tfoot>
            </table>

            <p className="mt-6 rounded-lg bg-sand/60 p-4 text-xs">
              <span className="text-muted">Payout to designer: </span>
              {invoice.releasedAt
                ? `Released ${formatDate(invoice.releasedAt)}`
                : invoice.status === 'REFUNDED'
                  ? 'Refunded to the client'
                  : 'Held until the client approves the stage'}
            </p>
          </div>

          <div className="no-print mt-6 flex flex-wrap justify-end gap-3">
            <Button size="sm" onClick={() => window.print()}>
              <Printer aria-hidden className="h-4 w-4" />
              Print or save PDF
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
