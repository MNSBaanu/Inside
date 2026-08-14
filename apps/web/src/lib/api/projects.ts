import { apiRequest } from '@/lib/api/client';
import type { Project } from '@/lib/api/types';

export function listProjects() {
  return apiRequest<{ items: Project[] }>('/projects');
}

export function getProject(id: string) {
  return apiRequest<{ project: Project }>(`/projects/${id}`);
}

export function cancelProject(id: string) {
  return apiRequest<{ project: Project }>(`/projects/${id}/cancel`, {
    method: 'PATCH',
  });
}

export function holdProject(id: string) {
  return apiRequest<{ project: Project }>(`/projects/${id}/on-hold`, {
    method: 'PATCH',
  });
}

export function resumeProject(id: string) {
  return apiRequest<{ project: Project }>(`/projects/${id}/resume`, {
    method: 'PATCH',
  });
}

export type ProjectActivity = {
  id: string;
  projectId: string | null;
  userId: string | null;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null } | null;
};

export function listProjectActivity(projectId: string) {
  return apiRequest<{ items: ProjectActivity[] }>(
    `/projects/${projectId}/activity`,
  );
}
