import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright';
import { expect, test } from '@playwright/test';
import { accounts, signIn } from './helpers';

test.describe('Signing in', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });

  test('rejects a wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email', { exact: true }).fill(accounts.nadia);
    await page.getByLabel('Password', { exact: true }).fill('WrongPassword1!');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByText(/password is incorrect/i).first()).toBeVisible();
  });

  test('refuses a suspended account', async ({ page }) => {
    await page.goto('/login');
    await clerk.signIn({ page, emailAddress: accounts.suspended });
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?suspended=1/);
    await expect(page.getByText('Account suspended')).toBeVisible();
  });

  test('returns to the page that asked for sign in', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveURL(/\/login\?redirect_url=.*%2Fprojects/);
    await clerk.signIn({ page, emailAddress: accounts.nadia });
    await page.reload();
    await expect(page).toHaveURL(/\/projects$/);
  });

  test('ignores a ?next= link to another site', async ({ page }) => {
    await page.goto('/login?next=https://evil.example');
    await clerk.signIn({ page, emailAddress: accounts.nadia });
    await page.reload();
    await expect(page).toHaveURL(/localhost:3100\/dashboard/);
  });

  test('registers a new client', async ({ page }) => {
    const run = Date.now();
    await page.goto('/register');
    await page.getByLabel('Full name').fill('Playwright Client');
    await page
      .getByLabel('Email', { exact: true })
      .fill(`pw-${run}+clerk_test@example.com`);
    await page.getByLabel('Password', { exact: true }).fill(`Inside-${run}-pw!`);
    await page.getByRole('button', { name: 'Create account', exact: true }).click();
    await page.getByLabel('Verification code').fill('424242');
    await page.getByRole('button', { name: 'Verify email', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('signs out', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The sign-out button sits in the desktop sidebar.');
    await signIn(page, accounts.nadia);
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/localhost:3100\/$/);
    await page.goto('/projects');
    await expect(page).toHaveURL(/\/login/);
  });
});
