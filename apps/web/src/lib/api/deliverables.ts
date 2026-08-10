import { apiRequest } from '@/lib/api/client';
import type { Deliverable } from '@/lib/api/types';

export function listDeliverables(stageId: string) {
  return apiRequest<{ items: Deliverable[] }>(`/stages/${stageId}/deliverables`);
}

export function addDeliverable(
  stageId: string,
  input: { fileUrl: string; fileName?: string; notes?: string },
) {
  return apiRequest<{ deliverable: Deliverable }>(
    `/stages/${stageId}/deliverables`,
    { method: 'POST', body: input },
  );
}

export function setDeliverableFeedback(id: string, feedback: string) {
  return apiRequest<{ deliverable: Deliverable }>(
    `/deliverables/${id}/feedback`,
    { method: 'PATCH', body: { feedback } },
  );
}
