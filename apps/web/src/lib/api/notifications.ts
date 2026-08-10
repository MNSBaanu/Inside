import { apiRequest } from '@/lib/api/client';
import type { AppNotification } from '@/lib/api/types';

export function listNotifications() {
  return apiRequest<{ items: AppNotification[] }>('/notifications');
}

export function markNotificationRead(id: string) {
  return apiRequest<{ notification: AppNotification }>(
    `/notifications/${id}/read`,
    { method: 'PATCH' },
  );
}

export function markAllNotificationsRead() {
  return apiRequest<{ updated: number }>('/notifications/read-all', {
    method: 'PATCH',
  });
}
