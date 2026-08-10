import { apiRequest } from '@/lib/api/client';
import type { Brief } from '@/lib/api/types';

export type BriefInput = {
  moodboardId?: string;
  styles: string[];
  rooms: string[];
  budgetRange?: string;
  description?: string;
};

export function listBriefs() {
  return apiRequest<{ items: Brief[] }>('/briefs');
}

export function getBrief(id: string) {
  return apiRequest<{ brief: Brief }>(`/briefs/${id}`);
}

export function createBrief(body: BriefInput) {
  return apiRequest<{ brief: Brief }>('/briefs', {
    method: 'POST',
    body,
  });
}

export function generateBriefFromMoodboard(
  moodboardId: string,
  body: Partial<BriefInput> = {},
) {
  return apiRequest<{ brief: Brief }>(`/moodboards/${moodboardId}/briefs`, {
    method: 'POST',
    body,
  });
}

export function updateBrief(
  id: string,
  body: {
    styles?: string[];
    rooms?: string[];
    budgetRange?: string;
    description?: string;
    moodboardId?: string | null;
  },
) {
  return apiRequest<{ brief: Brief }>(`/briefs/${id}`, {
    method: 'PATCH',
    body,
  });
}

export function deleteBrief(id: string) {
  return apiRequest<{ deleted: boolean }>(`/briefs/${id}`, {
    method: 'DELETE',
  });
}
