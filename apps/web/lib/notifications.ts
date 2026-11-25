import type { Notification } from '@/lib/types';

export function notificationHref(item: Notification): string | null {
  const meta = item.metadata ?? {};
  if (typeof meta.href === 'string' && meta.href.startsWith('/')) return meta.href;
  if (typeof meta.projectId === 'string') {
    const tab =
      item.type === 'MESSAGE'
        ? '?tab=messages'
        : item.type === 'PAYMENT'
          ? '?payment=1'
          : meta.tab === 'work-log'
            ? '?tab=work-log'
            : '';
    return `/projects/${meta.projectId}${tab}`;
  }
  if (typeof meta.requestId === 'string') return `/requests/${meta.requestId}`;
  if (item.type === 'VERIFICATION') return '/verification';
  return null;
}
