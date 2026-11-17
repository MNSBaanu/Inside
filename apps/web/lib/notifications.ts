import type { Notification } from '@/lib/types';

export function notificationHref(item: Notification): string | null {
  const meta = item.metadata ?? {};
  if (typeof meta.href === 'string' && meta.href.startsWith('/')) return meta.href;
  if (typeof meta.projectId === 'string') return `/projects/${meta.projectId}`;
  if (typeof meta.requestId === 'string') return `/requests/${meta.requestId}`;
  if (item.type === 'VERIFICATION') return '/verification';
  return null;
}
