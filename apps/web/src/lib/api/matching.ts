import { apiRequest } from '@/lib/api/client';
import type { MatchResult } from '@/lib/api/types';

export function matchDesigners(briefId: string) {
  return apiRequest<{ briefId: string; items: MatchResult[] }>(
    `/match/designers?briefId=${encodeURIComponent(briefId)}`,
  );
}
