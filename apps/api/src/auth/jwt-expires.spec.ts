import { parseJwtExpiresIn } from './jwt-expires';

describe('parseJwtExpiresIn', () => {
  it('parses day/hour/minute/second suffixes', () => {
    expect(parseJwtExpiresIn('7d')).toBe(604800);
    expect(parseJwtExpiresIn('12h')).toBe(43200);
    expect(parseJwtExpiresIn('15m')).toBe(900);
    expect(parseJwtExpiresIn('30s')).toBe(30);
  });

  it('accepts raw seconds and defaults to 7d', () => {
    expect(parseJwtExpiresIn('3600')).toBe(3600);
    expect(parseJwtExpiresIn(undefined)).toBe(604800);
    expect(parseJwtExpiresIn('nope')).toBe(604800);
  });
});
