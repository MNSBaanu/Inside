import { apiRequest } from '@/lib/api/client';
import type { Report, ReportTargetType } from '@/lib/api/types';

export type CreateReportInput = {
  targetType: ReportTargetType;
  targetId: string;
  reportedUserId?: string;
  reason: string;
  details?: string;
};

export function createReport(input: CreateReportInput) {
  return apiRequest<{ report: Report }>('/reports', {
    method: 'POST',
    body: input,
  });
}

export function listMyReports() {
  return apiRequest<{ items: Report[] }>('/reports/mine');
}
