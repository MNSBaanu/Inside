import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SiteHeader } from './site-header';

const route = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('next/navigation', () => ({
  usePathname: () => route.pathname,
  useSelectedLayoutSegment: () => null,
}));
vi.mock('@/components/providers/session-provider', () => ({
  useSession: () => ({ user: null, status: 'unauthenticated' }),
}));
vi.mock('@/components/layout/account-menu', () => ({
  AccountMenu: () => null,
}));

afterEach(() => {
  cleanup();
  route.pathname = '/';
});

describe('Mobile navigation', () => {
  it('closes on route changes and releases the body scroll lock', () => {
    const { rerender } = render(<SiteHeader />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(document.body.style.overflow).toBe('hidden');
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    route.pathname = '/designers';
    rerender(<SiteHeader />);
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(document.body.style.overflow).toBe('');
  });
});
