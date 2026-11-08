import { expect, test } from '@playwright/test';

test.describe('Designer directory', () => {
  test('preserves search when reloading and returning from a profile', async ({
    page,
  }) => {
    await page.goto('/designers');
    await page.getByLabel('Search').fill('Ravi');
    await expect(page).toHaveURL(/\/designers\?q=Ravi$/);
    await page.reload();
    await expect(page.getByLabel('Search')).toHaveValue('Ravi');
    await expect(page.getByRole('status')).toHaveText('1 designer found');
    await page.getByRole('link', { name: /Ravi Designer/ }).click();
    await expect(
      page.getByRole('heading', { name: 'Ravi Designer' }),
    ).toBeVisible();
    await page.goBack();
    await expect(page.getByLabel('Search')).toHaveValue('Ravi');
    await expect(page.getByRole('status')).toHaveText('1 designer found');
  });

  test('filters unavailable designers and prevents requesting them on their profile', async ({
    page,
  }) => {
    await page.goto('/designers');
    const nimal = page.getByRole('link', { name: /Nimal Herath/ });
    await expect(nimal).toContainText('Not taking work');
    await nimal.click();
    await expect(
      page.getByRole('button', { name: 'Not taking new requests' }),
    ).toBeDisabled();
    await expect(
      page.getByRole('link', { name: 'Request this designer' }),
    ).toHaveCount(0);
    await page.goBack();
    await page.getByRole('combobox', { name: 'Availability' }).click();
    await page.getByRole('option', { name: 'Available now' }).click();
    await expect(page).toHaveURL(/availableOnly=true/);
    await expect(page.getByRole('status')).toContainText('designers found');
    await expect(page.getByRole('link', { name: /Nimal Herath/ })).toHaveCount(
      0,
    );
  });
});
