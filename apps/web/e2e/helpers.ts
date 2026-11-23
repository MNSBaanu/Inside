import { clerk } from '@clerk/testing/playwright';
import { expect, type Page } from '@playwright/test';

/** Password shared by every seeded account (packages/database/prisma/seed.ts) and its Clerk user. */
export const PASSWORD = 'Password123!';

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

/** Opens a list page and follows the link with the given title. */
export async function openFromList(page: Page, path: string, title: string) {
  await page.goto(path);
  await page.getByRole('link', { name: new RegExp(title) }).first().click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
}
