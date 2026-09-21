'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { api, errorMessage } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { MilestonePayment } from '@/lib/types';

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

  async function act(paymentId: string, action: 'pay' | 'release') {
    setActionError(null);
    setPending(paymentId);
    try {
      if (action === 'pay') {
        const { url } = await api.post<{ url: string }>(
          `/payments/${paymentId}/checkout`,
        );
        window.location.assign(url);
        return;
      }
      await api.patch(`/payments/${paymentId}/${action}`, {});
      await reload();
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
            className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-hairline bg-surface p-6"
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
                  onClick={() => act(payment.id, 'pay')}
                >
                  Pay
                </Button>
              ) : null}
              {isClient && payment.status === 'PAID' ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending === payment.id}
                  onClick={() => act(payment.id, 'release')}
                >
                  Release
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
