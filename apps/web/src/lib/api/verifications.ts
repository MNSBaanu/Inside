import { apiRequest } from '@/lib/api/client';
import type { Verification } from '@/lib/api/types';

export function submitVerification(input: {
  evidenceUrl: string;
  notes?: string;
}) {
  return apiRequest<{ verification: Verification }>('/verifications', {
    method: 'POST',
    body: input,
  });
}

export function listMyVerifications() {
  return apiRequest<{ items: Verification[] }>('/verifications/mine');
}
