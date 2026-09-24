import { expect, test } from '@playwright/test';
import { accounts, signIn } from './helpers';

test.describe('Portfolio discovery', () => {
  test('filters portfolios by designer location', async ({ page }) => {
    await page.goto('/portfolios');
    await page.getByLabel('Location').fill('Kandy');
    await expect(page.getByText('Scandinavian Living Room')).toBeVisible();
    await expect(page.getByText('Colombo Loft')).toBeHidden();
  });

  test('searches portfolios by keyword', async ({ page }) => {
    await page.goto('/portfolios');
    await page.getByLabel('Search').fill('teak');
    await expect(page.getByText('Family Kitchen in Teak')).toBeVisible();
    await expect(page.getByText('Scandinavian Living Room')).toBeHidden();
  });

  test('a saved portfolio shapes the brief made from its moodboard', async ({ page }) => {
    const board = `Teak ideas ${Date.now()}`;
    await signIn(page, accounts.nadia);
    await page.goto('/moodboards');
    await page.getByLabel('Name').fill(board);
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: board })).toBeVisible();

    await page.goto('/portfolios');
    await page.getByRole('link', { name: /Family Kitchen in Teak/ }).first().click();
    await page.getByLabel('Moodboard', { exact: true }).click();
    await page.getByRole('option', { name: board }).click();
    await page.getByRole('button', { name: `Save to ${board}` }).click();
    await expect(page.getByText(`Saved to ${board}.`)).toBeVisible();

    await page.goto('/moodboards');
    await page
      .getByRole('listitem')
      .filter({ has: page.getByRole('heading', { name: board }) })
      .getByRole('button', { name: 'Turn into brief' })
      .click();
    await expect(page).toHaveURL(/\/briefs\/[0-9a-f-]+$/);
    await expect(page.getByText('Traditional', { exact: true })).toBeVisible();
    await expect(page.getByText('Kitchen', { exact: true }).first()).toBeVisible();
  });
});
