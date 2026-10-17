import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SiteHeader } from './site-header';

const route = vi.hoisted(() => ({ pathname: '/', authenticated: false }));
vi.mock('next/navigation', () => ({
  usePathname: () => route.pathname,
  useSelectedLayoutSegment: () => null,
}));
vi.mock('@/components/providers/session-provider', () => ({
  useSession: () => ({
    user: route.authenticated
      ? { id: 'qa', name: 'QA Client', activeRole: 'CLIENT' }
      : null,
    status: route.authenticated ? 'authenticated' : 'unauthenticated',
  }),
}));
vi.mock('@/components/layout/account-menu', () => ({
  AccountMenu: () => null,
}));

afterEach(() => {
  cleanup();
  route.pathname = '/';
  route.authenticated = false;
});

describe('Mobile navigation', () => {
  it('exposes messages and notifications to signed-in phone users', () => {
    route.authenticated = true;
    render(<SiteHeader />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(
      screen.getByRole('link', { name: 'Messages', exact: true }),
    ).toHaveAttribute('href', '/messages');
    expect(
      screen.getByRole('link', { name: 'Notifications', exact: true }),
    ).toHaveAttribute('href', '/notifications');
  });
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
