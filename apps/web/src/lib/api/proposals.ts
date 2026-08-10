import { apiRequest } from '@/lib/api/client';
import type { Project, Proposal, StageFee } from '@/lib/api/types';

export type CreateProposalInput = {
  scope: string;
  timeline: string;
  stageFees: StageFee[];
};

export function listProposals(requestId: string) {
  return apiRequest<{ items: Proposal[] }>(`/requests/${requestId}/proposals`);
}

export function createProposal(requestId: string, body: CreateProposalInput) {
  return apiRequest<{ proposal: Proposal }>(
    `/requests/${requestId}/proposals`,
    { method: 'POST', body },
  );
}

export function withdrawProposal(id: string) {
  return apiRequest<{ proposal: Proposal }>(`/proposals/${id}/withdraw`, {
    method: 'PATCH',
  });
}

export function rejectProposal(id: string) {
  return apiRequest<{ proposal: Proposal }>(`/proposals/${id}/reject`, {
    method: 'PATCH',
  });
}

export function acceptProposal(id: string) {
  return apiRequest<{ project: Project }>(`/proposals/${id}/accept`, {
    method: 'PATCH',
  });
}
