export function serializeReview(r: {
  id: string;
  projectId: string;
  reviewerId: string;
  designerId: string;
  rating: number;
  comment: string | null;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
  reviewer?: { id: string; name: string; avatarUrl: string | null };
}) {
  return {
    id: r.id,
    projectId: r.projectId,
    reviewerId: r.reviewerId,
    designerId: r.designerId,
    rating: r.rating,
    comment: r.comment,
    isVisible: r.isVisible,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    reviewer: r.reviewer ?? null,
  };
}
