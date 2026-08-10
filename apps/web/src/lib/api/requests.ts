import { apiRequest } from '@/lib/api/client';
import type { ProjectRequest, RequestType } from '@/lib/api/types';

export type CreateRequestInput = {
  title: string;
  description?: string;
  type: RequestType;
  designerId?: string;
  briefId?: string;
  budget?: number;
};

export function listRequests() {
  return apiRequest<{ items: ProjectRequest[] }>('/requests');
}

export function getRequest(id: string) {
  return apiRequest<{ request: ProjectRequest }>(`/requests/${id}`);
}

export function createRequest(body: CreateRequestInput) {
  return apiRequest<{ request: ProjectRequest }>('/requests', {
    method: 'POST',
    body,
  });
}

export function cancelRequest(id: string) {
  return apiRequest<{ request: ProjectRequest }>(`/requests/${id}/cancel`, {
    method: 'PATCH',
  });
}

export function closeRequest(id: string) {
  return apiRequest<{ request: ProjectRequest }>(`/requests/${id}/close`, {
    method: 'PATCH',
  });
}
