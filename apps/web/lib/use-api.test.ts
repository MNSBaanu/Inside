import { describe, expect, it } from 'vitest';
import { buildQuery } from './use-api';

describe('buildQuery', () => {
  it('returns an empty string when nothing is set', () => {
    expect(buildQuery({})).toBe('');
    expect(buildQuery({ style: undefined, page: undefined })).toBe('');
  });

  it('omits empty strings so blank filters are not sent', () => {
    expect(buildQuery({ style: '', roomType: 'Kitchen' })).toBe(
      '?roomType=Kitchen',
    );
  });

  it('keeps numeric zero rather than dropping it', () => {
    expect(buildQuery({ minBudget: 0 })).toBe('?minBudget=0');
  });

  it('encodes values that need it', () => {
    expect(buildQuery({ q: 'living room' })).toBe('?q=living+room');
  });
});
