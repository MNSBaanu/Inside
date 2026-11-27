import { clerk } from '@clerk/testing/playwright';
import { expect, type Page } from '@playwright/test';

/** Clerk password for a seeded test account, from E2E_*_PASSWORD (.env.local or CI secrets). */
export function passwordFor(email: string) {
  const key = email.startsWith('admin@')
    ? 'E2E_ADMIN_PASSWORD'
    : email.includes('designer')
      ? 'E2E_DESIGNER_PASSWORD'
      : 'E2E_CLIENT_PASSWORD';
  const password = process.env[key];
  if (!password) throw new Error(`Set ${key} to create ${email} in Clerk.`);
  return password;
}

export const accounts = {
  admin: 'admin@insidesign.me',
  nadia: 'client@insidesign.me',
  kasun: 'client3@insidesign.me',
  suspended: 'suspended.client@insidesign.me',
  ravi: 'designer@insidesign.me',
  tharushi: 'designer3@insidesign.me',
};

/** Signs in through Clerk with a sign-in token, then opens `next` (or the dashboard). */
export async function signIn(page: Page, email: string, next?: string) {
  await page.goto('/login');
  await clerk.signIn({ page, emailAddress: email });
  await page.goto(next ?? '/dashboard');
  await expect(page).toHaveURL(next ?? /\/(dashboard|admin)/);
}

/** Opens a list page, optionally switches to a tab, and follows the link with the given title. */
export async function openFromList(page: Page, path: string, title: string, tab?: string) {
  await page.goto(path);
  if (tab) await page.getByRole('tab', { name: new RegExp(tab) }).click();
  await page.getByRole('link', { name: new RegExp(title) }).first().click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
}
