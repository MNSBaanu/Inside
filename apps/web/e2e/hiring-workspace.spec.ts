import { test, expect } from '@playwright/test';

test.describe('Hiring, Workspace, Stages & Payments Flow', () => {
  test('client can view requests and proposals', async ({ page }) => {
    // Sign in as client
    await page.goto('/login');
    await page.getByRole('button', { name: 'Client', exact: true }).click();
    await page.getByRole('button', { name: /Sign in/i }).click();

    await page.goto('/client/requests');
    await expect(page.getByRole('heading', { name: /Requests|Project Requests/i })).toBeVisible({ timeout: 10000 });
  });

  test('designer can access designer requests inbox and portfolio manager', async ({ page }) => {
    // Sign in as designer
    await page.goto('/login');
    await page.getByRole('button', { name: 'Designer', exact: true }).click();
    await page.getByRole('button', { name: /Sign in/i }).click();

    await page.goto('/designer/requests');
    await expect(page.getByRole('heading', { name: /Requests|Client Requests/i })).toBeVisible({ timeout: 10000 });

    await page.goto('/designer/portfolios');
    await expect(page.getByRole('heading', { name: /Portfolios|My Portfolios/i })).toBeVisible({ timeout: 10000 });
  });

  test('parties can access active projects and stage workspace', async ({ page }) => {
    // Sign in as client
    await page.goto('/login');
    await page.getByRole('button', { name: 'Client', exact: true }).click();
    await page.getByRole('button', { name: /Sign in/i }).click();

    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: /Projects|Active Projects/i })).toBeVisible({ timeout: 10000 });

    // If there is an active project card, click it
    const firstProjectLink = page.locator('a[href^="/projects/"]').first();
    if (await firstProjectLink.isVisible()) {
      await firstProjectLink.click();
      // Should display 5 stages timeline (Proposal, Concept, Design, Revision, Completion)
      await expect(page.locator('text=Concept').or(page.locator('text=Proposal')).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('notifications page displays system updates', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Client', exact: true }).click();
    await page.getByRole('button', { name: /Sign in/i }).click();

    await page.goto('/notifications');
    await expect(page.getByRole('heading', { name: /Notifications/i })).toBeVisible({ timeout: 10000 });
  });
});
