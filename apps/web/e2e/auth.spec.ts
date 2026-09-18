import { expect, test } from '@playwright/test';
import { PASSWORD, accounts, signIn } from './helpers';

test.describe('Signing in', () => {
  test('rejects a wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(accounts.nadia);
    await page.getByLabel('Password').fill('WrongPassword1!');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });

  test('refuses a suspended account', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(accounts.suspended);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Account suspended')).toBeVisible();
  });

  test('returns to the page that asked for sign in', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveURL(/\/login\?next=%2Fprojects/);
    await page.getByLabel('Email').fill(accounts.nadia);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/projects$/);
  });

  test('ignores a ?next= link to another site', async ({ page }) => {
    await page.goto('/login?next=https://evil.example');
    await page.getByLabel('Email').fill(accounts.nadia);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/localhost:3100\/dashboard/);
  });

  test('registers a new client who still needs to verify their email', async ({
    page,
  }) => {
    await page.goto('/register');
    await page.getByLabel('Full name').fill('Playwright Client');
    await page.getByLabel('Email').fill(`pw-${Date.now()}@inside.test`);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("Your email isn't verified yet.")).toBeVisible();
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
