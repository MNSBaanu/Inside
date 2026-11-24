import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ProjectListItem } from '@/lib/types';
import MessagesPage from './page';

const items: ProjectListItem[] = [
  {
    id: 'p1',
    proposalId: 'pr1',
    clientId: 'c1',
    designerId: 'd1',
    title: 'Colombo apartment',
    currentStage: 'CONCEPT',
    status: 'ACTIVE',
    portfolioShare: null,
    portfolioId: null,
    startedAt: null,
    completedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    unreadCount: 2,
    lastMessage: {
      projectId: 'p1',
      senderId: 'd1',
      content: 'Sending the concept boards tonight.',
      sentAt: '2026-03-02T00:00:00.000Z',
    },
  },
  {
    id: 'p2',
    proposalId: 'pr2',
    clientId: 'c1',
    designerId: 'd2',
    title: 'Kandy villa',
    currentStage: 'DESIGN',
    status: 'ACTIVE',
    portfolioShare: null,
    portfolioId: null,
    startedAt: null,
    completedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    unreadCount: 0,
    lastMessage: null,
  },
];

vi.mock('@/lib/api/use-api', () => ({
  useApi: () => ({
    data: { items },
    error: null,
    loading: false,
    reload: vi.fn(),
  }),
  buildQuery: () => '',
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/components/providers/session-provider', () => ({
  useSession: () => ({ user: { id: 'c1' } }),
}));

vi.mock('@/components/features/projects/message-thread', () => ({
  MessageThread: ({ projectId }: { projectId: string }) => (
    <div data-testid="open-thread">{projectId}</div>
  ),
}));

describe('MessagesPage', () => {
  it('shows the latest message and an unread count per thread', () => {
    render(<MessagesPage />);

    const thread = screen.getByRole('link', { name: /Colombo apartment/ });
    expect(
      within(thread).getByText('Sending the concept boards tonight.'),
    ).toBeInTheDocument();
    expect(within(thread).getByLabelText('2 unread')).toHaveTextContent('2');
  });

  it('opens the most recent conversation beside the list', () => {
    render(<MessagesPage />);

    expect(screen.getByTestId('open-thread')).toHaveTextContent('p2');
  });

  it('falls back to a placeholder when a project has no messages', () => {
    render(<MessagesPage />);

    const thread = screen.getByRole('link', { name: /Kandy villa/ });
    expect(within(thread).getByText('No messages yet.')).toBeInTheDocument();
    expect(within(thread).queryByText(/unread/)).not.toBeInTheDocument();
  });

  it('orders threads by the most recent message first', () => {
    render(<MessagesPage />);

    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveTextContent('Kandy villa');
    expect(links[1]).toHaveTextContent('Colombo apartment');
  });
});
