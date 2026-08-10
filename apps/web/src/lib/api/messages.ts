import { apiRequest } from '@/lib/api/client';
import type { Message } from '@/lib/api/types';

export const MESSAGE_MAX_LENGTH = 4000;

export function listMessages(projectId: string) {
  return apiRequest<{ items: Message[] }>(`/projects/${projectId}/messages`);
}

export function sendMessage(
  projectId: string,
  input: { content: string; attachmentUrl?: string; attachmentType?: string },
) {
  return apiRequest<{ message: Message }>(`/projects/${projectId}/messages`, {
    method: 'POST',
    body: input,
  });
}

export function markProjectMessagesRead(projectId: string) {
  return apiRequest<{ updated: number }>(
    `/projects/${projectId}/messages/read-all`,
    { method: 'PATCH' },
  );
}

export function markMessageRead(id: string) {
  return apiRequest<{ message: Message }>(`/messages/${id}/read`, {
    method: 'PATCH',
  });
}
