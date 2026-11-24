import type { ReportStatus, ReportTargetType } from '@inside/database';

export function serializeReport(r: {
  id: string;
  reporterId: string;
  reportedUserId: string | null;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  resolvedById: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: r.id,
    reporterId: r.reporterId,
    reportedUserId: r.reportedUserId,
    targetType: r.targetType,
    targetId: r.targetId,
    reason: r.reason,
    details: r.details,
    status: r.status,
    resolvedById: r.resolvedById,
    resolvedAt: r.resolvedAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}
