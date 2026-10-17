import { expect, test, type Page } from '@playwright/test';
import { PASSWORD, accounts, openFromList, signIn } from './helpers';

const WEB_ORIGIN = 'http://localhost:3100';
const STAGES = ['proposal', 'concept', 'design', 'revision', 'completion'];

/** The UI test servers have no Cloudinary account, so uploads are answered in the browser. */
async function fakeUploads(page: Page) {
  const cors = {
    'access-control-allow-origin': WEB_ORIGIN,
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-allow-methods': 'POST, OPTIONS',
  };
  await page.route('**/uploads/signature', (route) =>
    route.request().method() === 'OPTIONS'
      ? route.fulfill({ status: 204, headers: cors })
      : route.fulfill({
          headers: cors,
          json: {
            success: true,
            data: {
              cloudName: 'demo',
              resourceType: 'auto',
              params: { api_key: 'key', timestamp: '1', signature: 'sig' },
            },
          },
        }),
  );
  await page.route('https://api.cloudinary.com/**', (route) =>
    route.fulfill({
      headers: { 'access-control-allow-origin': '*' },
      json: { secure_url: 'https://res.cloudinary.com/demo/raw/upload/stage.pdf' },
    }),
  );
}

function stageCard(page: Page, index: number) {
  return page
    .getByRole('listitem')
    .filter({ hasText: new RegExp(`^${index + 1}\\s*${STAGES[index]}`, 'i') });
}

test('a new client goes from the landing page to a completed, reviewed project', async ({
  page,
  browser,
}) => {
  test.setTimeout(300_000);
  const run = Date.now();
  const title = `Journey living room ${run}`;
  const reviewText = `Smooth project from start to finish (${run}).`;

  await test.step('guest starts from the landing page and creates an account', async () => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Start a brief' }).first().click();
    await expect(page).toHaveURL(/\/login\?next=/);
    await page.getByRole('link', { name: /Create an account/ }).click();
    await expect(page).toHaveURL(/\/register/);
    await page.getByRole('button', { name: /I have a space/ }).click();
    await page.getByLabel('Full name').fill('Journey Client');
    await page.getByLabel('Email').fill(`journey-${run}@inside.test`);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  await test.step('client finds and saves a designer', async () => {
    await page.goto('/designers');
    await page.getByLabel('Search').fill('Ravi');
    await page.getByRole('button', { name: 'Apply filters' }).click();
    await page.getByRole('link', { name: /Ravi Designer/ }).first().click();
    await expect(page.getByRole('heading', { name: 'Ravi Designer' })).toBeVisible();
    await page.getByRole('button', { name: 'Save designer' }).click();
    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible();

    await page.goto('/favourites');
    await expect(page.getByText('Ravi Designer').first()).toBeVisible();
  });

  await test.step('client writes a brief and requests a matched designer', async () => {
    await page.goto('/briefs/new');
    await page.getByLabel('Rooms').fill('Living Room');
    await page.getByLabel('Rooms').press('Enter');
    await page.getByLabel('Styles').fill('Scandinavian');
    await page.getByLabel('Styles').press('Enter');
    await page.getByLabel('Budget range').fill('400000-500000');
    await page.getByLabel('Description').fill('Calm, light living room.');
    await page.getByRole('button', { name: 'Create brief' }).click();
    await expect(page).toHaveURL(/\/briefs\/[0-9a-f-]+$/);

    const match = page.getByRole('listitem').filter({ hasText: 'Ravi Designer' });
    await expect(match.getByText(/% match/)).toBeVisible();
    await expect(match.getByText('Description', { exact: true })).toBeVisible();
    await match.getByRole('link', { name: 'Request', exact: true }).click();
    await expect(page).toHaveURL(/\/requests\/new\?designerId=.+&briefId=/);

    await page.getByLabel('Title').fill(title);
    await page.getByLabel('Description').fill('Please quote for the full living room.');
    await page.getByLabel('Expected timeline').fill('6 weeks');
    await page.getByLabel('Budget').fill('450000');
    await page.getByRole('button', { name: 'Send request' }).click();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
  });

  const designerContext = await browser.newContext();
  const designer = await designerContext.newPage();
  await fakeUploads(designer);

  await test.step('designer sends a proposal with stage fees', async () => {
    await signIn(designer, accounts.ravi);
    await openFromList(designer, '/requests', title);
    await designer.getByLabel('Scope').fill('Layout, concept boards, full design and a revision round.');
    await designer.getByLabel('Timeline').fill('6 weeks');
    for (const stage of STAGES.slice(1)) {
      await designer.getByLabel(stage, { exact: true }).fill('100000');
    }
    await designer.getByRole('button', { name: 'Send proposal' }).click();
    await expect(designer.getByRole('button', { name: 'Send proposal' })).toBeHidden();
  });

  let projectUrl = '';
  await test.step('client reviews the proposal and accepts', async () => {
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Proposals received' })).toBeVisible();
    await page
      .getByRole('listitem')
      .filter({ hasText: 'Ravi Designer' })
      .getByRole('button', { name: 'Accept proposal' })
      .click();
    await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+$/);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    projectUrl = page.url();
  });

  await designer.goto(projectUrl);

  for (let index = 0; index < STAGES.length; index += 1) {
    const name = STAGES[index];

    await test.step(`designer works on the ${name} stage`, async () => {
      await designer.reload();
      const card = stageCard(designer, index);
      const start = card.getByRole('button', { name: 'Start stage' });
      const submit = card.getByRole('button', { name: /Submit for review/ });
      await expect(start.or(submit)).toBeVisible();
      if (await start.isVisible()) await start.click();
      await expect(submit).toBeVisible();

      const task = `Finish ${name} work`;
      await card.getByLabel('New task').fill(task);
      await card.getByRole('button', { name: 'Add task' }).click();
      await card.getByRole('checkbox', { name: task }).check();
      await expect(card.getByText('1/1 done')).toBeVisible();

      await card.getByRole('button', { name: 'Files' }).click();
      await card.getByLabel('File', { exact: true }).setInputFiles({
        name: `${name}.pdf`,
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 journey test'),
      });
      await expect(card.getByText(`Uploaded ${name}.pdf`)).toBeVisible();
      await card.getByRole('button', { name: 'Add deliverable' }).click();
      await expect(card.getByRole('link', { name: `${name}.pdf` })).toBeVisible();

      await submit.click();
      await expect(card.getByText('Submitted', { exact: true })).toBeVisible();
    });

    await test.step(`client approves the ${name} stage`, async () => {
      await page.reload();
      const card = stageCard(page, index);
      await expect(card.getByText('1/1 done')).toBeVisible();
      await card.getByRole('button', { name: 'Approve' }).click();
      await expect(card.getByText('Approved', { exact: true })).toBeVisible();
    });

    if (index === 1) {
      await test.step('client tries to pay the first milestone', async () => {
        await page.getByRole('tab', { name: 'Payments' }).click();
        await page.getByRole('button', { name: 'Test payment' }).first().click();
        // The UI test servers run without a Stripe key.
        await expect(page.getByText('Demo payments require a Stripe test-mode key. Live payments are not supported.')).toBeVisible();
        await page.getByRole('tab', { name: 'Stages' }).click();
      });
    }
  }

  await designerContext.close();

  await test.step('client reviews the completed project', async () => {
    await page.reload();
    await expect(page.getByText('Completed', { exact: true }).first()).toBeVisible();
    await page.getByRole('tab', { name: 'Review' }).click();
    await page.getByRole('button', { name: '5 stars' }).click();
    await page.getByLabel('Comment').fill(reviewText);
    await page.getByRole('button', { name: 'Publish review' }).click();
    await expect(page.getByText('Thanks for your review.')).toBeVisible();
  });

  await test.step('admin approves the review and it shows on the profile', async () => {
    const adminContext = await browser.newContext();
    const admin = await adminContext.newPage();
    await signIn(admin, accounts.admin);
    await admin.goto('/admin');
    await admin.getByRole('tab', { name: 'Reviews' }).click();
    const review = admin.getByRole('listitem').filter({ hasText: reviewText });
    await review.getByRole('button', { name: 'Show review' }).click();
    await expect(review.getByText('Visible', { exact: true })).toBeVisible();
    await adminContext.close();

    const guestContext = await browser.newContext();
    const guest = await guestContext.newPage();
    await guest.goto('/designers');
    await guest.getByRole('link', { name: /Ravi Designer/ }).first().click();
    await expect(guest.getByText(reviewText)).toBeVisible();
    await guestContext.close();
  });
});
