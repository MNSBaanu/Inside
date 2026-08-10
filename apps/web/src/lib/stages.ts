import type { StageName } from '@/lib/api/types';

export const STAGE_ORDER: readonly StageName[] = [
  'PROPOSAL',
  'CONCEPT',
  'DESIGN',
  'REVISION',
  'COMPLETION',
] as const;

export const STAGE_LABELS: Record<StageName, string> = {
  PROPOSAL: 'Proposal',
  CONCEPT: 'Concept',
  DESIGN: 'Design',
  REVISION: 'Revision',
  COMPLETION: 'Completion',
};

export function formatLkr(amount: number | null | undefined) {
  if (amount == null) return '—';
  return `LKR ${amount.toLocaleString()}`;
}
