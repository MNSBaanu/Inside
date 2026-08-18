import { test, expect } from '@playwright/test';

test.describe('Admin Console & Platform Moderation Flow', () => {
  test('unauthorized client cannot access admin console', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Client', exact: true }).click();
    await page.getByRole('button', { name: /Sign in/i }).click();

    await page.goto('/admin');
    // Should redirect away or show access denied / not found
    await expect(page).not.toHaveURL(/\/admin$/);
  });

  test('admin can view user moderation, verifications, and report queues', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Admin', exact: true }).click();
    await page.getByRole('button', { name: /Sign in/i }).click();

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /Admin Console|Admin/i })).toBeVisible({ timeout: 10000 });

    // Verify presence of Admin tabs / navigation (Users, Verifications, Reports)
    await expect(page.locator('text=Users').or(page.locator('text=Members')).first()).toBeVisible();
    await expect(page.locator('text=Verifications').or(page.locator('text=Verification')).first()).toBeVisible();
    await expect(page.locator('text=Reports').or(page.locator('text=Moderation')).first()).toBeVisible();
  });
});
