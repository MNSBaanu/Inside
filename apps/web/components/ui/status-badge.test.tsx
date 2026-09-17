import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  it('renders an enum value as readable words', () => {
    render(<StatusBadge status="IN_PROGRESS" />);
    expect(screen.getByText('in progress')).toBeInTheDocument();
  });

  it('uses the success tone for approved states', () => {
    render(<StatusBadge status="APPROVED" />);
    expect(screen.getByText('approved').className).toContain('support-soft');
  });

  it('falls back to a neutral tone for an unknown status', () => {
    render(<StatusBadge status="SOMETHING_NEW" />);
    expect(screen.getByText('something new').className).toContain('bg-sand');
  });
});
