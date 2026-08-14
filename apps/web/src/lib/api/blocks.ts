import { apiRequest } from '@/lib/api/client';

export type Block = {
  id: string;
  blockerId: string;
  blockedId: string;
  reason: string | null;
  createdAt: string;
  blocked: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
};

export function listBlocks() {
  return apiRequest<{ items: Block[] }>('/blocks');
}

export function blockUser(blockedId: string, reason?: string) {
  return apiRequest<{ block: Block }>('/blocks', {
    method: 'POST',
    body: { blockedId, reason },
  });
}

export function unblockUser(blockedId: string) {
  return apiRequest<{ deleted: true }>(`/blocks/${blockedId}`, {
    method: 'DELETE',
  });
}
