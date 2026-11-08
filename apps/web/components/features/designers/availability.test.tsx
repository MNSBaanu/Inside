import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DesignerProfilePage from '@/app/designers/[id]/page';
import { DesignerCard } from './designer-card';

const mocks = vi.hoisted(() => ({ useApi: vi.fn() }));
vi.mock('@/lib/api/use-api', () => ({ useApi: mocks.useApi }));
vi.mock('@/components/features/designers/favourite-button', () => ({
  FavouriteButton: () => null,
}));
vi.mock('@/components/features/moderation/block-button', () => ({
  BlockButton: () => null,
}));
vi.mock('@/components/features/moderation/report-dialog', () => ({
  ReportDialog: () => null,
}));
vi.mock('@/components/features/reviews/review-list', () => ({ ReviewList: () => null }));

afterEach(cleanup);

const designer = {
  id: 'd1',
  name: 'Designer',
  bio: null,
  avatarUrl: null,
  location: 'Kandy',
  isVerified: true,
  isAvailable: false,
  createdAt: '2026-10-17',
  rating: { average: 4.5, count: 2 },
};

describe('Designer availability', () => {
  it('shows availability and an explicit review count on cards', () => {
    render(
      <DesignerCard
        designer={{ ...designer, portfolioCount: 1, previews: [] }}
      />,
    );
    expect(screen.getByText('Not taking work')).toBeVisible();
    expect(screen.getByText('4.5 from 2 reviews')).toBeVisible();
  });

  it('keeps an unavailable profile viewable without a request link', () => {
    mocks.useApi.mockReturnValue({
      data: { designer, portfolios: [] },
      loading: false,
      error: null,
    });
    render(<DesignerProfilePage params={{ id: 'd1' }} />);
    expect(screen.getByRole('heading', { name: 'Designer' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Not taking new requests' }),
    ).toBeDisabled();
    expect(
      screen.queryByRole('link', { name: 'Request this designer' }),
    ).not.toBeInTheDocument();
  });

  it('offers a direct request when the designer is available', () => {
    mocks.useApi.mockReturnValue({
      data: { designer: { ...designer, isAvailable: true }, portfolios: [] },
      loading: false,
      error: null,
    });
    render(<DesignerProfilePage params={{ id: 'd1' }} />);
    expect(
      screen.getByRole('link', { name: 'Request this designer' }),
    ).toHaveAttribute('href', '/requests/new?designerId=d1');
  });
});
