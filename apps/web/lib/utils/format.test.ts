import { describe, expect, it } from 'vitest';
import { formatDate, formatMoney, titleCase } from './format';

describe('formatMoney', () => {
  it('renders an em dash when there is no amount', () => {
    expect(formatMoney(null)).toBe('-');
    expect(formatMoney(undefined)).toBe('-');
  });

  it('formats zero rather than treating it as missing', () => {
    expect(formatMoney(0)).toContain('0');
  });

  it('includes the amount for a normal value', () => {
    expect(formatMoney(650000)).toContain('650,000');
  });
});

describe('formatDate', () => {
  it('renders an em dash for a missing date', () => {
    expect(formatDate(null)).toBe('-');
  });

  it('formats an ISO string', () => {
    expect(formatDate('2026-03-14T00:00:00.000Z')).toContain('2026');
  });
});

describe('titleCase', () => {
  it('turns an enum value into readable words', () => {
    expect(titleCase('IN_PROGRESS')).toBe('In progress');
    expect(titleCase('COMPLETION')).toBe('Completion');
  });
});
