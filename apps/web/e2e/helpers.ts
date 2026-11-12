import { expect, type Page } from '@playwright/test';

/** Password shared by every seeded account (packages/database/prisma/seed.ts). */
export const PASSWORD = 'Password123!';

export const accounts = {
  admin: 'admin@inside.test',
  nadia: 'client@inside.test',
  kasun: 'client3@inside.test',
  suspended: 'suspended.client@inside.test',
  ravi: 'designer@inside.test',
  tharushi: 'designer3@inside.test',
};

export async function signIn(page: Page, email: string, next?: string) {
  await page.goto(next ? `/login?next=${encodeURIComponent(next)}` : '/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(next ?? /\/(dashboard|admin)/);
}

/** Opens a list page and follows the link with the given title. */
export async function openFromList(page: Page, path: string, title: string) {
  await page.goto(path);
  await page.getByRole('link', { name: new RegExp(title) }).first().click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
}
