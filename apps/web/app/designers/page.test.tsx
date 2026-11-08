import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DesignersPage from './page';

const mocks = vi.hoisted(() => ({ push: vi.fn(), useApi: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('@/lib/api/use-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api/use-api')>()),
  useApi: mocks.useApi,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useApi.mockReturnValue({
    data: { items: [], total: 25 },
    loading: false,
    error: null,
  });
});
afterEach(cleanup);

describe('Designer discovery URLs', () => {
  it('restores every filter from a shared URL and announces the count', () => {
    render(
      <DesignersPage
        searchParams={{
          q: 'Ravi',
          location: 'Kandy',
          style: 'Scandinavian',
          verifiedOnly: 'true',
          availableOnly: 'true',
          page: '2',
        }}
      />,
    );
    expect(screen.getByLabelText('Search')).toHaveValue('Ravi');
    expect(screen.getByLabelText('Location')).toHaveValue('Kandy');
    expect(screen.getByRole('combobox', { name: 'Style' })).toHaveTextContent(
      'Scandinavian',
    );
    expect(
      screen.getByRole('combobox', { name: 'Verification' }),
    ).toHaveTextContent('Verified only');
    expect(
      screen.getByRole('combobox', { name: 'Availability' }),
    ).toHaveTextContent('Available now');
    expect(mocks.useApi).toHaveBeenCalledWith(
      '/designers?q=Ravi&location=Kandy&style=Scandinavian&verifiedOnly=true&availableOnly=true&page=2&pageSize=12',
    );
    expect(screen.getByRole('status')).toHaveTextContent('25 designers found');
  });

  it('applies draft filters together and resets pagination', () => {
    render(<DesignersPage searchParams={{ page: '3', style: 'Coastal' }} />);
    fireEvent.change(screen.getByLabelText('Search'), {
      target: { value: ' Ravi ' },
    });
    expect(mocks.push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
    expect(mocks.push).toHaveBeenCalledWith('/designers?q=Ravi&style=Coastal', {
      scroll: false,
    });
  });

  it('restores form fields when URL navigation returns to an earlier search', () => {
    const { rerender } = render(<DesignersPage searchParams={{ q: 'Ravi' }} />);
    fireEvent.change(screen.getByLabelText('Search'), {
      target: { value: 'draft' },
    });
    rerender(<DesignersPage searchParams={{ location: 'Colombo' }} />);
    expect(screen.getByLabelText('Search')).toHaveValue('');
    expect(screen.getByLabelText('Location')).toHaveValue('Colombo');
    rerender(<DesignersPage searchParams={{ q: 'Ravi' }} />);
    expect(screen.getByLabelText('Search')).toHaveValue('Ravi');
    expect(screen.getByLabelText('Location')).toHaveValue('');
  });

  it('clears unsaved fields even when already on the unfiltered URL', () => {
    render(<DesignersPage searchParams={{}} />);
    fireEvent.change(screen.getByLabelText('Search'), {
      target: { value: 'draft' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Clear$/ }));
    expect(screen.getByLabelText('Search')).toHaveValue('');
    expect(mocks.push).toHaveBeenCalledWith('/designers', { scroll: false });
  });

  it('rejects invalid page parameters and exposes loading to assistive technology', () => {
    mocks.useApi.mockReturnValue({ data: null, loading: true, error: null });
    render(
      <DesignersPage searchParams={{ page: '-5', verifiedOnly: 'false' }} />,
    );
    expect(mocks.useApi).toHaveBeenCalledWith('/designers?page=1&pageSize=12');
    expect(
      screen.getByRole('region', { name: 'Designer results' }),
    ).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Finding designers');
  });
});
