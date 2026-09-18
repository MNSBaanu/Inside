import { describe, expect, it } from 'vitest';
import { safeHref, safeRedirectPath } from './url';

describe('safeRedirectPath', () => {
  it('keeps same-site paths', () => {
    expect(safeRedirectPath('/projects/1?tab=a', '/dashboard')).toBe(
      '/projects/1?tab=a',
    );
  });

  it('falls back for external or protocol-relative targets', () => {
    for (const value of [
      'https://evil.example',
      '//evil.example',
      '/\\evil.example',
      'javascript:alert(1)',
      null,
    ]) {
      expect(safeRedirectPath(value, '/dashboard')).toBe('/dashboard');
    }
  });
});

describe('safeHref', () => {
  it('allows http(s) and drops other schemes', () => {
    expect(safeHref('https://res.cloudinary.com/a.pdf')).toBe(
      'https://res.cloudinary.com/a.pdf',
    );
    expect(safeHref('javascript:alert(1)')).toBeUndefined();
  });
});
