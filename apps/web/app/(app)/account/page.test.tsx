import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@/lib/types';
import AccountPage from './page';

const session = vi.hoisted(() => ({
  user: null as User | null,
  refreshUser: vi.fn(),
}));
vi.mock('@/components/providers/session-provider', () => ({
  useSession: () => session,
}));
vi.mock('@/components/layout/app-shell', () => ({ useSignOut: () => vi.fn() }));
vi.mock('@/components/account/password-form', () => ({
  PasswordForm: () => null,
}));
vi.mock('@/components/account/role-switch', () => ({ RoleSwitch: () => null }));
vi.mock('@/components/ui/file-upload', () => ({ FileUpload: () => null }));

afterEach(cleanup);

describe('Account profile editing', () => {
  it('initializes from the user and preserves unsaved edits through session refreshes', () => {
    session.user = {
      id: 'a',
      name: 'Original name',
      role: 'CLIENT',
      isAvailable: true,
    } as User;
    const { rerender } = render(<AccountPage />);
    const name = screen.getByLabelText('Full name');
    expect(name).toHaveValue('Original name');
    fireEvent.change(name, { target: { value: 'Unsaved name' } });
    session.user = { ...session.user, name: 'Refreshed server name' };
    rerender(<AccountPage />);
    expect(screen.getByLabelText('Full name')).toHaveValue('Unsaved name');
  });

  it('resets the form when a different account is shown', () => {
    session.user = {
      id: 'a',
      name: 'First client',
      role: 'CLIENT',
      isAvailable: true,
    } as User;
    const { rerender } = render(<AccountPage />);
    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'First draft' },
    });
    session.user = { ...session.user, id: 'b', name: 'Second client' };
    rerender(<AccountPage />);
    expect(screen.getByLabelText('Full name')).toHaveValue('Second client');
  });
});
