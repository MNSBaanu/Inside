import { apiRequest } from '@/lib/api/client';
import type { Moodboard, MoodboardItem } from '@/lib/api/types';

export function listMoodboards() {
  return apiRequest<{ items: Moodboard[] }>('/moodboards');
}

export function getMoodboard(id: string) {
  return apiRequest<{ moodboard: Moodboard }>(`/moodboards/${id}`);
}

export function createMoodboard(body: {
  name: string;
  savedItems?: MoodboardItem[];
}) {
  return apiRequest<{ moodboard: Moodboard }>('/moodboards', {
    method: 'POST',
    body,
  });
}

export function updateMoodboard(
  id: string,
  body: { name?: string; savedItems?: MoodboardItem[] },
) {
  return apiRequest<{ moodboard: Moodboard }>(`/moodboards/${id}`, {
    method: 'PATCH',
    body,
  });
}

export function deleteMoodboard(id: string) {
  return apiRequest<{ deleted: boolean }>(`/moodboards/${id}`, {
    method: 'DELETE',
  });
}

export function addMoodboardItem(id: string, body: MoodboardItem) {
  return apiRequest<{ moodboard: Moodboard }>(`/moodboards/${id}/items`, {
    method: 'POST',
    body,
  });
}

export function removeMoodboardItem(id: string, index: number) {
  return apiRequest<{ moodboard: Moodboard }>(
    `/moodboards/${id}/items/${index}`,
    { method: 'DELETE' },
  );
}
