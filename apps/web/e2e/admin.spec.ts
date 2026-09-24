import { expect, test } from '@playwright/test';
import { accounts, signIn } from './helpers';

test.describe('Admin', () => {
  test('publishes a review that was waiting for moderation', async ({ page }) => {
    await signIn(page, accounts.admin);
    await page.goto('/admin');
    await page.getByRole('tab', { name: 'Reviews' }).click();

    const review = page
      .getByRole('listitem')
      .filter({ hasText: 'Great ideas for the indoor-outdoor flow.' });
    await expect(review.getByText('Hidden', { exact: true })).toBeVisible();
    await review.getByRole('button', { name: 'Show review' }).click();
    await expect(review.getByText('Visible', { exact: true })).toBeVisible();
  });

  test('filters reviews by whether they are visible', async ({ page }) => {
    await signIn(page, accounts.admin);
    await page.goto('/admin');
    await page.getByRole('tab', { name: 'Reviews' }).click();

    const text = 'Beautiful joinery and very tidy on site.';
    const review = page.getByRole('listitem').filter({ hasText: text });
    const badges = (label: string) =>
      page.getByRole('listitem').getByText(label, { exact: true });

    await page.getByRole('button', { name: 'Visible', exact: true }).click();
    await expect(badges('Hidden')).toHaveCount(0);
    await review.getByRole('button', { name: 'Hide review' }).click();
    await expect(review).toHaveCount(0);

    await page.getByRole('button', { name: 'Waiting or hidden' }).click();
    await expect(badges('Visible')).toHaveCount(0);
    await review.getByRole('button', { name: 'Show review' }).click();
    await expect(review).toHaveCount(0);
  });

  test('shows platform activity including admin actions', async ({ page }) => {
    await signIn(page, accounts.admin);
    await page.goto('/admin');
    await page.getByRole('tab', { name: 'Activity' }).click();
    await expect(page.getByText(/user suspended/i).first()).toBeVisible();
  });

  test('keeps other users out of the admin area', async ({ page }) => {
    await signIn(page, accounts.nadia);
    await page.goto('/admin');
    await expect(page.getByText('Admins only.')).toBeVisible();
  });
});
