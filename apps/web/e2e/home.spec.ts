import { expect, test } from '@playwright/test';

test.describe('Home page', () => {
  test('subscribes to updates from the footer', async ({ page }) => {
    await page.goto('/how-it-works');
    await page.getByLabel('A little inspiration in your inbox').fill(`reader-${Date.now()}@example.com`);
    await page.getByRole('button', { name: 'Subscribe' }).click();
    await expect(page.getByText("Thanks, you're on the list")).toBeVisible();
  });
});
