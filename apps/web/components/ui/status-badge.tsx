import type { ReactNode } from 'react';
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

const icons: Record<StatusGroup, ReactNode> = {
  action: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  progress: <path d="M5 12h14M13 6l6 6-6 6" />,
  done: <path d="M5 12l5 5 9-10" />,
  problem: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5v.5" />
    </>
  ),
  closed: <path d="M6 12h12" />,
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

  return (
    <span
      className={cn(
        'inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 text-[0.8125rem] font-semibold',
        styles[group],
      )}
    >
      <svg
        aria-hidden
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {icons[group]}
      </svg>
      {readable(status)}
    </span>
  );
}
