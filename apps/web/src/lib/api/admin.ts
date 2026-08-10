import { apiRequest } from '@/lib/api/client';
import type {
  AccountStatus,
  AdminUser,
  Report,
  Verification,
} from '@/lib/api/types';

export function listAdminUsers() {
  return apiRequest<{ items: AdminUser[] }>('/admin/users');
}

export function suspendUser(id: string) {
  return apiRequest<{ user: { id: string; status: AccountStatus } }>(
    `/admin/users/${id}/suspend`,
    { method: 'PATCH' },
  );
}

export function reactivateUser(id: string) {
  return apiRequest<{ user: { id: string; status: AccountStatus } }>(
    `/admin/users/${id}/reactivate`,
    { method: 'PATCH' },
  );
}

export function listOpenReports() {
  return apiRequest<{ items: Report[] }>('/admin/reports');
}

export function resolveReport(id: string) {
  return apiRequest<{ report: Report }>(`/admin/reports/${id}/resolve`, {
    method: 'PATCH',
  });
}

export function dismissReport(id: string) {
  return apiRequest<{ report: Report }>(`/admin/reports/${id}/dismiss`, {
    method: 'PATCH',
  });
}

export function listPendingVerifications() {
  return apiRequest<{ items: Verification[] }>('/verifications/admin/pending');
}

export function approveVerification(id: string) {
  return apiRequest<{ verification: Verification }>(
    `/verifications/${id}/approve`,
    { method: 'PATCH' },
  );
}

export function rejectVerification(id: string, notes?: string) {
  return apiRequest<{ verification: Verification }>(
    `/verifications/${id}/reject`,
    { method: 'PATCH', body: notes ? { notes } : {} },
  );
}
