import { describe, expect, it } from 'vitest';
import { formatBudgetRange, formatDate, formatMoney, titleCase } from './format';

describe('formatMoney', () => {
  it('renders an em dash when there is no amount', () => {
    expect(formatMoney(null)).toBe('—');
    expect(formatMoney(undefined)).toBe('—');
  });

  it('formats zero rather than treating it as missing', () => {
    expect(formatMoney(0)).toContain('0');
  });

  it('includes the amount for a normal value', () => {
    expect(formatMoney(650000)).toContain('650,000');
  });
});

describe('formatBudgetRange', () => {
  it('joins both ends when a full range is given', () => {
    const result = formatBudgetRange(100000, 500000);
    expect(result).toContain('100,000');
    expect(result).toContain('500,000');
  });

  it('falls back to the single value that exists', () => {
    expect(formatBudgetRange(null, 500000)).toContain('500,000');
    expect(formatBudgetRange(100000, null)).toContain('100,000');
  });

  it('reports when nothing is set', () => {
    expect(formatBudgetRange(null, null)).toBe('Budget not set');
  });
});

describe('formatDate', () => {
  it('renders an em dash for a missing date', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('formats an ISO string', () => {
    expect(formatDate('2026-03-14T00:00:00.000Z')).toContain('2026');
  });
});

describe('titleCase', () => {
  it('turns an enum value into readable words', () => {
    expect(titleCase('IN_PROGRESS')).toBe('in progress');
    expect(titleCase('COMPLETION')).toBe('completion');
  });
});
