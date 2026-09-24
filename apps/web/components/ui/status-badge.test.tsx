import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge, statusGroup } from './status-badge';

describe('StatusBadge', () => {
  it('renders an enum value as readable words', () => {
    render(<StatusBadge status="IN_PROGRESS" />);
    expect(screen.getByText('In progress')).toBeInTheDocument();
  });

  it('uses the done tone for approved states', () => {
    render(<StatusBadge status="APPROVED" />);
    expect(screen.getByText('Approved').className).toContain(
      'bg-status-done-soft',
    );
  });

  it('uses the problem tone for rejected and failed states', () => {
    expect(statusGroup('REJECTED')).toBe('problem');
    expect(statusGroup('FAILED')).toBe('problem');
  });

  it('marks states waiting on someone as needing action', () => {
    expect(statusGroup('PENDING')).toBe('action');
    expect(statusGroup('SUBMITTED')).toBe('action');
  });

  it('falls back to the closed tone for an unknown status', () => {
    render(<StatusBadge status="SOMETHING_NEW" />);
    expect(screen.getByText('Something new').className).toContain(
      'bg-status-closed-soft',
    );
  });
});
