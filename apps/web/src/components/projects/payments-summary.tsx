'use client';

import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/layout/status-pill';
import type { MilestonePayment, ProjectStage } from '@/lib/api/types';
import { STAGE_LABELS, formatLkr } from '@/lib/stages';

export function PaymentsSummary({
  payments,
  stages,
  isClient,
  busy,
  onPay,
  onRelease,
}: {
  payments: MilestonePayment[];
  stages: ProjectStage[];
  isClient: boolean;
  busy: boolean;
  onPay: (id: string) => void;
  onRelease: (id: string) => void;
}) {
  const total = (status?: MilestonePayment['status']) =>
    payments
      .filter((payment) => (status ? payment.status === status : true))
      .reduce((sum, payment) => sum + (payment.amount ?? 0), 0);

  const billed = total();
  const paid = total('PAID');
  const released = total('RELEASED');
  const outstanding = total('PENDING');

  const stageLabel = (stageId: string) => {
    const stage = stages.find((item) => item.id === stageId);
    return stage ? STAGE_LABELS[stage.name] : 'Stage';
  };

  return (
    <section className="surface-panel space-y-5 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-heading text-2xl tracking-tight">Milestones</h2>
        <p className="text-sm text-muted-foreground">
          A milestone is billed when you approve its stage.
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Billed', value: billed },
          { label: 'Awaiting payment', value: outstanding },
          { label: 'Paid, in escrow', value: paid },
          { label: 'Released', value: released },
        ].map((item) => (
          <div key={item.label} className="space-y-1">
            <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {item.label}
            </dt>
            <dd className="font-heading text-xl tabular-nums">
              {formatLkr(item.value)}
            </dd>
          </div>
        ))}
      </dl>

      {payments.length === 0 ? (
        <p className="border-t border-border/60 pt-4 text-sm text-muted-foreground">
          No milestones billed yet.
        </p>
      ) : (
        <ul className="space-y-3 border-t border-border/60 pt-4">
          {payments.map((payment) => (
            <li
              key={payment.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill value={payment.status} />
                  <span className="text-sm font-medium">
                    {stageLabel(payment.stageId)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {payment.releasedAt
                    ? `Released ${new Date(payment.releasedAt).toLocaleDateString()}`
                    : payment.paidAt
                      ? `Paid ${new Date(payment.paidAt).toLocaleDateString()}`
                      : `Billed ${new Date(payment.createdAt).toLocaleDateString()}`}
                  {payment.stripeIntentId ? ` · ${payment.stripeIntentId}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-heading text-lg tabular-nums">
                  {formatLkr(payment.amount)}
                </span>
                {isClient && payment.status === 'PENDING' ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy}
                    onClick={() => onPay(payment.id)}
                  >
                    Pay
                  </Button>
                ) : null}
                {isClient && payment.status === 'PAID' ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => onRelease(payment.id)}
                  >
                    Release
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
