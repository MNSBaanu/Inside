import { similarities, tokenize } from './text-similarity';

describe('text similarity', () => {
  it('drops stop words and short words and folds simple plurals', () => {
    expect(tokenize('The shelves and lights, with an oak desk')).toEqual([
      'shelve',
      'light',
      'oak',
      'desk',
    ]);
  });

  it('scores a document sharing words above one sharing none', () => {
    const [close, far] = similarities('light oak shelving', [
      'oak shelving in light tones',
      'dark concrete floors',
    ]);
    expect(close).toBeGreaterThan(0);
    expect(far).toBe(0);
  });

  it('returns 0 for empty text', () => {
    expect(similarities('', ['oak shelving'])).toEqual([0]);
  });
});
