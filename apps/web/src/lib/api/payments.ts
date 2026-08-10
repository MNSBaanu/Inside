import { apiRequest } from '@/lib/api/client';
import type { MilestonePayment } from '@/lib/api/types';

export function listPayments(projectId: string) {
  return apiRequest<{ items: MilestonePayment[] }>(
    `/projects/${projectId}/payments`,
  );
}

/** Stand-in for a Stripe intent id until real payments are wired up. */
export function generatePaymentReference() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `INSIDE-${Date.now().toString(36).toUpperCase()}-${random}`;
}

export function payPayment(id: string, stripeIntentId?: string) {
  return apiRequest<{ payment: MilestonePayment }>(`/payments/${id}/pay`, {
    method: 'PATCH',
    body: { stripeIntentId: stripeIntentId ?? generatePaymentReference() },
  });
}

export function releasePayment(id: string) {
  return apiRequest<{ payment: MilestonePayment }>(`/payments/${id}/release`, {
    method: 'PATCH',
  });
}
