import {
  Check,
  ChevronRight,
  CircleAlert,
  Clock,
  Minus,
  type LucideIcon,
} from 'lucide-react';
import type {
  PaymentStatus,
  ProjectStatus,
  ProposalStatus,
  RequestStatus,
  StageStatus,
  VerificationStatus,
} from '@/lib/types';
import { cn } from '@/lib/utils/cn';

type AnyStatus =
  | RequestStatus
  | ProposalStatus
  | ProjectStatus
  | StageStatus
  | PaymentStatus
  | VerificationStatus;

export type StatusGroup = 'action' | 'progress' | 'done' | 'problem' | 'closed';

const groups: Record<string, StatusGroup> = {
  PENDING: 'action',
  SUBMITTED: 'action',
  UNDER_REVIEW: 'action',
  OPEN: 'progress',
  ACTIVE: 'progress',
  IN_PROGRESS: 'progress',
  PROCESSING: 'progress',
  ACCEPTED: 'done',
  APPROVED: 'done',
  PAID: 'done',
  RELEASED: 'done',
  COMPLETED: 'done',
  RESOLVED: 'done',
  REJECTED: 'problem',
  FAILED: 'problem',
  CANCELLED: 'closed',
  WITHDRAWN: 'closed',
  CLOSED: 'closed',
  DISMISSED: 'closed',
  ON_HOLD: 'closed',
  REFUNDED: 'closed',
};

const styles: Record<StatusGroup, string> = {
  action: 'bg-status-action-soft text-status-action',
  progress: 'bg-status-progress-soft text-status-progress',
  done: 'bg-status-done-soft text-status-done',
  problem: 'bg-status-problem-soft text-status-problem',
  closed: 'bg-status-closed-soft text-status-closed',
};

const icons: Record<StatusGroup, LucideIcon> = {
  action: Clock,
  progress: ChevronRight,
  done: Check,
  problem: CircleAlert,
  closed: Minus,
};

export function statusGroup(status: string): StatusGroup {
  return groups[status] ?? 'closed';
}

function readable(status: string) {
  const words = status.toLowerCase().replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function StatusBadge({ status }: { status: AnyStatus | string }) {
  const group = statusGroup(status);
  const Icon = icons[group];

  return (
    <span
      className={cn(
        'inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 text-[0.8125rem] font-semibold',
        styles[group],
      )}
    >
      <Icon aria-hidden size={14} strokeWidth={2.2} />
      {readable(status)}
    </span>
  );
}
