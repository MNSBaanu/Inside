import { expect, test } from '@playwright/test';

test.describe('Home page', () => {
  test('shows a design tip for a hero hotspot and hides it again', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/');
    const pin = page.getByRole('button', { name: 'Lighting' });
    const tip = page.getByRole('note').filter({ hasText: 'Set the perfect mood' });

    if (isMobile) {
      await pin.tap();
      await expect(tip).toBeVisible();
      await page.getByRole('heading', { level: 1 }).tap();
    } else {
      await pin.hover();
      await expect(tip).toBeVisible();
      await page.mouse.move(5, 5);
    }
    await expect(tip).toBeHidden();
  });

  test('subscribes to updates from the footer', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Get updates').fill(`reader-${Date.now()}@example.com`);
    await page.getByRole('button', { name: 'Subscribe' }).click();
    await expect(page.getByText("Thanks, you're on the list")).toBeVisible();
  });
});
