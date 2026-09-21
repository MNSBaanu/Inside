import { expect, test } from '@playwright/test';

test.describe('Portfolio discovery', () => {
  test('filters portfolios by designer location', async ({ page }) => {
    await page.goto('/portfolios');
    await page.getByLabel('Location').fill('Kandy');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText('Scandinavian Living Room')).toBeVisible();
    await expect(page.getByText('Colombo Loft')).toBeHidden();
  });

  test('searches portfolios by keyword', async ({ page }) => {
    await page.goto('/portfolios');
    await page.getByLabel('Search').fill('teak');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText('Family Kitchen in Teak')).toBeVisible();
    await expect(page.getByText('Scandinavian Living Room')).toBeHidden();
  });
});
