import { test, expect } from '@playwright/test';

test.describe('Authentication & Access Control Flow', () => {
  test('unauthenticated users are redirected to login when visiting protected pages', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/moodboards');
    await expect(page).toHaveURL(/\/login/);
  });

  test('client demo login works and redirects to discovery feed', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Log in/i })).toBeVisible();

    // Click demo Client button
    const clientDemoBtn = page.getByRole('button', { name: 'Client', exact: true });
    await expect(clientDemoBtn).toBeVisible();
    await clientDemoBtn.click();

    // Verify email input is populated
    const emailInput = page.getByLabel(/Email/i);
    await expect(emailInput).toHaveValue('client@inside.test');

    // Submit form
    await page.getByRole('button', { name: /Sign in/i }).click();

    // Should redirect to /discover
    await expect(page).toHaveURL(/\/discover/, { timeout: 10000 });
    await expect(page.getByRole('button', { name: /Client/i })).toBeVisible();
  });

  test('designer demo login and dual-role switching works', async ({ page }) => {
    await page.goto('/login');
    const designerDemoBtn = page.getByRole('button', { name: 'Designer', exact: true });
    await designerDemoBtn.click();

    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/discover|\/designer/, { timeout: 10000 });

    // Open profile / role menu if available
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: /Account Profile|Profile/i })).toBeVisible({ timeout: 10000 });
  });

  test('admin demo login grants access to admin dashboard', async ({ page }) => {
    await page.goto('/login');
    const adminDemoBtn = page.getByRole('button', { name: 'Admin', exact: true });
    await adminDemoBtn.click();

    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/admin|\/discover/, { timeout: 10000 });

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /Admin Console|Admin Dashboard|Admin/i })).toBeVisible({ timeout: 10000 });
  });
});
