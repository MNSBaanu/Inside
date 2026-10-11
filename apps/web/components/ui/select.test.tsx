import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Select } from './select';

afterEach(cleanup);

describe('Select keyboard accessibility', () => {
  it('announces the active option and commits a keyboard selection', () => {
    const change = vi.fn();
    render(
      <>
        <label htmlFor="room">Room</label>
        <Select
          id="room"
          value="living"
          options={[
            { value: 'living', label: 'Living room' },
            { value: 'kitchen', label: 'Kitchen' },
          ]}
          onChange={change}
        />
      </>,
    );
    const control = screen.getByRole('combobox', { name: 'Room' });
    expect(control).toHaveAttribute('aria-expanded', 'false');
    fireEvent.keyDown(control, { key: 'ArrowDown' });
    expect(control).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(control, { key: 'ArrowDown' });
    expect(control).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Kitchen' }).id,
    );
    fireEvent.keyDown(control, { key: 'Enter' });
    expect(change).toHaveBeenCalledWith('kitchen');
    expect(control).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on Escape without changing the selected value', () => {
    const change = vi.fn();
    render(
      <Select
        id="room"
        value="living"
        options={[{ value: 'living', label: 'Living room' }]}
        onChange={change}
      />,
    );
    const control = screen.getByRole('combobox');
    fireEvent.click(control);
    fireEvent.keyDown(control, { key: 'Escape' });
    expect(control).toHaveAttribute('aria-expanded', 'false');
    expect(change).not.toHaveBeenCalled();
  });
});
