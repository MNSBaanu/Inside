import { apiRequest } from '@/lib/api/client';
import type { ProjectStage } from '@/lib/api/types';

export function listStages(projectId: string) {
  return apiRequest<{ items: ProjectStage[] }>(`/projects/${projectId}/stages`);
}

export function startStage(id: string) {
  return apiRequest<{ stage: ProjectStage }>(`/stages/${id}/start`, {
    method: 'PATCH',
  });
}

export function submitStage(id: string) {
  return apiRequest<{ stage: ProjectStage }>(`/stages/${id}/submit`, {
    method: 'PATCH',
  });
}

export function approveStage(id: string) {
  return apiRequest<{ stage: ProjectStage }>(`/stages/${id}/approve`, {
    method: 'PATCH',
  });
}

export function rejectStage(id: string, reason?: string) {
  return apiRequest<{ stage: ProjectStage }>(`/stages/${id}/reject`, {
    method: 'PATCH',
    body: reason ? { reason } : {},
  });
}

export function setStageDueDate(id: string, dueDate: string | null) {
  return apiRequest<{ stage: ProjectStage }>(`/stages/${id}/due-date`, {
    method: 'PATCH',
    body: { dueDate },
  });
}
