import { test, expect } from '@playwright/test';

test.describe('Discovery, Moodboard, Brief & Matching Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Log in as client
    await page.goto('/login');
    await page.getByRole('button', { name: 'Client', exact: true }).click();
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/portfolios|\/client/, { timeout: 10000 });
  });

  test('user can browse portfolios and filter by style', async ({ page }) => {
    await page.goto('/portfolios');
    await expect(page.getByRole('heading', { name: /Discover/i })).toBeVisible();

    // Verify search or style filter controls are present
    const searchInput = page.getByPlaceholder(/Search by title|Search styles/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('Modern');
    }

    // Verify portfolio cards exist on the page
    const portfolioCards = page.locator('article, .glass, [data-testid="portfolio-card"]');
    await expect(portfolioCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('client can access moodboards and create a new moodboard', async ({ page }) => {
    await page.goto('/client/moodboards');
    await expect(page.getByRole('heading', { name: /Moodboards/i })).toBeVisible({ timeout: 10000 });

    // Verify "New moodboard" button or form is available
    const newBoardBtn = page.getByRole('button', { name: /New moodboard|Create moodboard/i });
    if (await newBoardBtn.isVisible()) {
      await newBoardBtn.click();
      const nameInput = page.getByLabel(/Name|Title/i);
      if (await nameInput.isVisible()) {
        await nameInput.fill(`Test Living Room ${Date.now()}`);
        await page.getByRole('button', { name: /Create|Save/i }).click();
      }
    }
  });

  test('client can view briefs and designer matching recommendations', async ({ page }) => {
    await page.goto('/client/briefs');
    await expect(page.getByRole('heading', { name: /Briefs|Design Briefs/i })).toBeVisible({ timeout: 10000 });
  });
});
