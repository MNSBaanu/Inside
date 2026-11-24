'use client';

import { useSession } from '@/components/providers/session-provider';
import { ButtonLink } from '@/components/ui/button';

export function RequestDesignerButton({
  designerId,
  portfolioId,
  fullWidth,
}: {
  designerId: string;
  portfolioId?: string;
  fullWidth?: boolean;
}) {
  const { user, status } = useSession();
  if (
    status === 'authenticated' &&
    (user?.activeRole !== 'CLIENT' || user.id === designerId)
  ) {
    return null;
  }
  return (
    <ButtonLink
      href={`/requests/new?designerId=${designerId}${portfolioId ? `&portfolioId=${portfolioId}` : ''}`}
      fullWidth={fullWidth}
    >
      Request this designer
    </ButtonLink>
  );
}
