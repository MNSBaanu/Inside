import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/designers',
  '/shop',
  '/open-projects',
  '/explore',
  '/how-it-works',
];

for (const path of PAGES) {
  test(`a11y: ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const summary = violations.map(
      (v) => `${v.impact} ${v.id} (${v.nodes.length}): ${v.help} -> ${v.nodes[0]?.target.join(' ')}`,
    );
    expect(summary, summary.join('\n')).toEqual([]);
  });
}
