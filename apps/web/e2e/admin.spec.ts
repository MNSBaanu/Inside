import { expect, test } from '@playwright/test';
import { accounts, signIn } from './helpers';

test.describe('Admin', () => {
  test('publishes a review that was waiting for moderation', async ({ page }) => {
    await signIn(page, accounts.admin);
    await page.goto('/admin/reviews');

    const review = page
      .getByRole('listitem')
      .filter({ hasText: 'Great ideas for the indoor-outdoor flow.' });
    await expect(review.getByText('Hidden', { exact: true })).toBeVisible();
    await review.getByRole('button', { name: 'Show review' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Show review' }).click();
    await expect(review.getByText('Visible', { exact: true })).toBeVisible();
  });

  test('shows platform activity including admin actions', async ({ page }) => {
    await signIn(page, accounts.admin);
    await page.goto('/admin/activity');
    await page.getByLabel('Search').fill('suspended');
    await expect(page.getByText(/user suspended/i).first()).toBeVisible();
  });

  test('keeps other users out of the admin area', async ({ page }) => {
    await signIn(page, accounts.nadia);
    await page.goto('/admin');
    await expect(page.getByText('Admins only.')).toBeVisible();
  });
});
