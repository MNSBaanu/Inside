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
  OPEN: 'ochre',
  PENDING: 'ochre',
  IN_PROGRESS: 'ochre',
  PROCESSING: 'ochre',
  UNDER_REVIEW: 'ochre',
  SUBMITTED: 'clay',
  ACTIVE: 'sage',
  ACCEPTED: 'sage',
  APPROVED: 'sage',
  PAID: 'sage',
  RELEASED: 'sage',
  COMPLETED: 'sage',
  RESOLVED: 'sage',
  REJECTED: 'clay',
  CANCELLED: 'neutral',
  WITHDRAWN: 'neutral',
  CLOSED: 'neutral',
  DISMISSED: 'neutral',
  ON_HOLD: 'neutral',
  FAILED: 'clay',
  REFUNDED: 'neutral',
};

export function StatusBadge({ status }: { status: AnyStatus | string }) {
  return (
    <Badge tone={tones[status] ?? 'neutral'}>
      {status.toLowerCase().replace(/_/g, ' ')}
    </Badge>
  );
}
