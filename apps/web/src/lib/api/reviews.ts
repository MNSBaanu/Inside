import { apiRequest } from '@/lib/api/client';
import type { Review, ReviewSummary } from '@/lib/api/types';

export function createReview(
  projectId: string,
  input: { rating: number; comment?: string },
) {
  return apiRequest<{ review: Review }>(`/projects/${projectId}/reviews`, {
    method: 'POST',
    body: input,
  });
}

export function listDesignerReviews(designerId: string) {
  return apiRequest<{ items: Review[]; summary: ReviewSummary }>(
    `/designers/${designerId}/reviews`,
    { auth: false },
  );
}
