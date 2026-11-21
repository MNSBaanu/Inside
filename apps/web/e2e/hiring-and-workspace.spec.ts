import { expect, test } from '@playwright/test';
import { accounts, openFromList, signIn } from './helpers';

test.describe('Hiring and the project workspace', () => {
  test('a client compares proposals side by side and hires a designer', async ({
    page,
  }) => {
    await signIn(page, accounts.kasun);
    await openFromList(page, '/requests', 'Japandi living room');

    const comparison = page.getByRole('table', { name: 'Proposals side by side' });
    await expect(comparison).toBeVisible();
    for (const name of ['Ravi Jayasinghe', 'Tharushi Wickramasinghe', 'Shenali De Silva']) {
      await expect(comparison.getByRole('columnheader', { name })).toBeVisible();
    }

    await page
      .getByRole('listitem')
      .filter({ hasText: 'Shenali De Silva' })
      .getByRole('button', { name: 'Accept proposal' })
      .click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Accept and start project' })
      .click();
    await expect(page).toHaveURL(/\/projects\//);
    await expect(page.getByRole('heading', { name: 'Japandi living room' })).toBeVisible();
  });

  test('a designer declines a direct request', async ({ page }) => {
    await signIn(page, accounts.ravi);
    await openFromList(page, '/requests', 'Dining room lighting plan');
    await page.getByRole('button', { name: 'Decline request' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Decline' }).click();
    await expect(page.getByText('Rejected', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Decline request' })).toBeHidden();
  });

  test('a client must give feedback to request changes, and it shows in the history', async ({
    page,
  }) => {
    await signIn(page, accounts.nadia);
    await openFromList(page, '/projects', 'Living room and kitchen refresh');

    const concept = page.getByRole('listitem').filter({ hasText: /^2\s*concept/i });
    await concept.getByRole('button', { name: 'Request changes' }).click();
    const send = concept.getByRole('button', { name: 'Send feedback' });
    await expect(send).toBeDisabled();

    const reason = 'Please try a warmer oak for the shelving.';
    await concept.getByLabel('What needs to change?').fill(reason);
    await send.click();
    await expect(concept.getByText('Rejected', { exact: true })).toBeVisible();

    await page.getByRole('tab', { name: 'History' }).click();
    await expect(page.getByText(reason)).toBeVisible();
  });

  test('a designer resubmits a revised stage and the client approves it', async ({
    page,
    browser,
  }) => {
    await signIn(page, accounts.tharushi);
    await openFromList(page, '/projects', 'Master bedroom makeover');
    const design = page.getByRole('listitem').filter({ hasText: /^3\s*design/i });
    await design.getByRole('button', { name: 'Resubmit for review' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Submit' }).click();
    await expect(design.getByText('Submitted', { exact: true })).toBeVisible();

    const clientContext = await browser.newContext();
    const clientPage = await clientContext.newPage();
    await signIn(clientPage, accounts.nadia);
    await openFromList(clientPage, '/projects', 'Master bedroom makeover');
    const clientDesign = clientPage
      .getByRole('listitem')
      .filter({ hasText: /^3\s*design/i });
    await clientDesign.getByRole('button', { name: 'Approve' }).click();
    await clientPage.getByRole('alertdialog').getByRole('button', { name: /^Approve/ }).click();
    await expect(clientDesign.getByText('Approved', { exact: true })).toBeVisible();
    await clientContext.close();
  });

  test('project messages are sent and shown in the thread', async ({ page }) => {
    await signIn(page, accounts.nadia);
    await openFromList(page, '/projects', 'Living room and kitchen refresh');
    await page.getByRole('tab', { name: 'Messages' }).click();

    const text = `Can we meet on site next week? (${Date.now()})`;
    await page.getByRole('textbox', { name: 'Message' }).fill(text);
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByText(text)).toBeVisible();
  });
});
