import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Role, User } from '@/lib/types';
import { AppShell } from './app-shell';

const session = vi.hoisted(() => ({
  user: null as User | null,
  status: 'authenticated',
  logout: vi.fn(),
  refreshUser: vi.fn(),
}));
vi.mock('@/components/providers/session-provider', () => ({
  useSession: () => session,
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock('@/components/features/announcements/announcement-banner', () => ({
  AnnouncementBanner: () => null,
}));
vi.mock('@/components/ui/toast', () => ({ useToast: () => vi.fn() }));

afterEach(cleanup);

/** Each sidebar group, by its label, with its links in order. */
function sidebar(role: Role) {
  session.user = {
    id: 'u1',
    name: 'Test',
    role,
    activeRole: role,
    hasClientAccount: false,
  } as User;
  render(<AppShell>page</AppShell>);
  const nav = screen.getByRole('navigation');
  return within(nav)
    .getAllByRole('group')
    .map((group) => [
      group.getAttribute('aria-label'),
      within(group)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ]);
}

describe('Sidebar', () => {
  it("follows a client's project from saved designers to projects", () => {
    expect(sidebar('CLIENT')).toEqual([
      ['Home', ['Overview']],
      [
        'Your project, step by step',
        ['Saved', 'Moodboards', 'Briefs', 'Requests', 'Projects'],
      ],
    ]);
  });

  it("follows a designer's work, with their profile kept apart", () => {
    expect(sidebar('DESIGNER')).toEqual([
      ['Home', ['Overview']],
      ['Your work, step by step', ['Requests', 'Projects', 'Schedule']],
      ['Your profile', ['My work', 'Verification']],
    ]);
  });

  it('follows the marketplace for admins, with tools grouped after it', () => {
    expect(sidebar('ADMIN')).toEqual([
      ['Home', ['Overview']],
      [
        'Marketplace, step by step',
        ['Users', 'Verifications', 'Open projects', 'Projects', 'Reviews'],
      ],
      ['Moderation', ['Reports']],
      ['Outreach', ['Announce', 'Newsletter', 'Contact']],
      ['Store', ['Shop']],
      ['Insights', ['Analytics', 'Activity']],
    ]);
  });

  it('keeps account, safety and sign out at the foot for members', () => {
    sidebar('CLIENT');
    expect(screen.getByRole('link', { name: 'Account' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Safety' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('shows admins no safety page, as before', () => {
    sidebar('ADMIN');
    expect(screen.queryByRole('link', { name: 'Safety' })).toBeNull();
  });
});
