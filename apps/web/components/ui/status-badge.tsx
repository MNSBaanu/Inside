import { Badge, type BadgeTone } from './badge';
import type {
  PaymentStatus,
  ProjectStatus,
  ProposalStatus,
  RequestStatus,
  StageStatus,
  VerificationStatus,
} from '@/lib/types';

type AnyStatus =
  | RequestStatus
  | ProposalStatus
  | ProjectStatus
  | StageStatus
  | PaymentStatus
  | VerificationStatus;

const tones: Record<string, BadgeTone> = {
  OPEN: 'highlight',
  PENDING: 'highlight',
  IN_PROGRESS: 'highlight',
  PROCESSING: 'highlight',
  UNDER_REVIEW: 'highlight',
  SUBMITTED: 'brand',
  ACTIVE: 'support',
  ACCEPTED: 'support',
  APPROVED: 'support',
  PAID: 'support',
  RELEASED: 'support',
  COMPLETED: 'support',
  RESOLVED: 'support',
  REJECTED: 'brand',
  CANCELLED: 'neutral',
  WITHDRAWN: 'neutral',
  CLOSED: 'neutral',
  DISMISSED: 'neutral',
  ON_HOLD: 'neutral',
  FAILED: 'brand',
  REFUNDED: 'neutral',
};

export function StatusBadge({ status }: { status: AnyStatus | string }) {
  return (
    <Badge tone={tones[status] ?? 'neutral'}>
      {status.toLowerCase().replace(/_/g, ' ')}
    </Badge>
  );
}
