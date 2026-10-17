// Explicitly authorized hosted QA only. Never seeds, migrates, resets or deletes a database.
// Creates labelled fixtures and changes only those fixtures. Never confirms a Stripe payment.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const apiUrl = process.env.HOSTED_API_URL;
const run = process.env.HOSTED_TEST_RUN;
const password = process.env.HOSTED_TEST_PASSWORD;
const mode = process.argv[2];
if (
  !apiUrl ||
  !run ||
  !password ||
  !['prepare', 'prepare-rest', 'submit', 'hold', 'finish', 'extras'].includes(
    mode,
  )
) {
  throw new Error(
    'Set HOSTED_API_URL, HOSTED_TEST_RUN and HOSTED_TEST_PASSWORD; choose prepare, submit or finish.',
  );
}
assert.equal(new URL(apiUrl).protocol, 'https:');
const outputDir = resolve('test-results');
await mkdir(outputDir, { recursive: true });
const fixturePath = resolve(outputDir, `hosted-${run}-fixtures.json`);
const resultPath = resolve(outputDir, `hosted-${run}-results.json`);
let fixture = { run, title: `QA hosted living room ${run}` };
let results = [];
if (mode !== 'prepare') {
  fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
  results = JSON.parse(await readFile(resultPath, 'utf8'));
}
const record = (name, status, detail = '') => {
  results.push({ name, status, detail, timestamp: new Date().toISOString() });
  console.log(`${status}: ${name}${detail ? ` — ${detail}` : ''}`);
};
async function http(method, path, actor, body) {
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(actor ? { Authorization: `Bearer ${actor.accessToken}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(40_000),
  });
  return {
    status: response.status,
    body: await response.json().catch(() => null),
  };
}
async function check(name, method, path, actor, body, expected = 200, verify) {
  const response = await http(method, path, actor, body);
  try {
    assert.equal(
      response.status,
      expected,
      `${path}: ${JSON.stringify(response.body?.error ?? {})}`,
    );
    if (expected < 400) assert.equal(response.body?.success, true);
    if (verify) verify(response.body?.data);
    record(name, 'PASS');
  } catch (error) {
    record(name, 'FAIL', error.message);
    throw error;
  }
  return response.body?.data;
}
async function login(email, pass = password) {
  const response = await http('POST', '/auth/login', null, {
    email,
    password: pass,
  });
  assert.equal(response.status, 201, `Login failed for ${email}`);
  return response.body.data;
}
async function register(email, role, name) {
  return check(
    `${role} registration`,
    'POST',
    '/auth/register',
    null,
    { email, password, name, role },
    201,
    (data) => assert.equal(data.user.role, role),
  );
}
const stageNames = ['PROPOSAL', 'CONCEPT', 'DESIGN', 'REVISION', 'COMPLETION'];
const fees = stageNames.map((name) => ({ name, fee: 100 }));
const scope = {
  scope: `QA only: full staged delivery ${run}`,
  timeline: '6 weeks',
  stageFees: fees,
};
let client, designer, other, admin;
async function actors() {
  client = await login(fixture.clientEmail);
  designer = await login(fixture.designerEmail);
  other = await login(fixture.otherEmail);
  const response = await http('POST', '/auth/login', null, {
    email: 'admin@inside.test',
    password: process.env.HOSTED_ADMIN_PASSWORD ?? 'Password123!',
  });
  if (response.status === 201 && response.body.data.user.role === 'ADMIN')
    admin = response.body.data;
  else
    record(
      'Administrator authentication',
      'BLOCKED',
      'Documented demo admin credentials unavailable; admin actions not performed.',
    );
}
async function prepareStage(stage) {
  if (stage.status === 'PENDING') {
    await check(
      `${stage.name} starts`,
      'PATCH',
      `/stages/${stage.id}/start`,
      designer,
    );
  }
  await check(
    `${stage.name} requires a deliverable`,
    'PATCH',
    `/stages/${stage.id}/submit`,
    designer,
    undefined,
    400,
  );
  const task = await check(
    `${stage.name} task creation`,
    'POST',
    `/stages/${stage.id}/tasks`,
    designer,
    { title: `QA ${stage.name} checklist` },
    201,
  );
  await check(
    `${stage.name} task completion`,
    'PATCH',
    `/tasks/${task.task.id}`,
    designer,
    { isDone: true },
    200,
    (data) => assert.equal(data.task.isDone, true),
  );
  await check(
    `${stage.name} deliverable`,
    'POST',
    `/stages/${stage.id}/deliverables`,
    designer,
    {
      fileUrl: fixture.fileUrl,
      fileName: `QA-${stage.name}.png`,
      notes: 'Generated QA test artifact; no customer information.',
    },
    201,
    (data) => assert.equal(data.deliverable.version, 1),
  );
  await check(
    `${stage.name} submission`,
    'PATCH',
    `/stages/${stage.id}/submit`,
    designer,
    undefined,
    200,
    (data) => assert.equal(data.stage.status, 'SUBMITTED'),
  );
}

try {
  if (mode === 'prepare') {
    await check(
      'Hosted database health',
      'GET',
      '/health',
      null,
      undefined,
      200,
      (data) => assert.equal(data.status, 'ok'),
    );
    await check(
      'Guest cannot list projects',
      'GET',
      '/projects',
      null,
      undefined,
      401,
    );
    fixture.clientEmail = process.env.HOSTED_CLIENT_EMAIL;
    assert.ok(
      fixture.clientEmail,
      'HOSTED_CLIENT_EMAIL must identify the client registered through the browser.',
    );
    client = await login(fixture.clientEmail);
    fixture.clientId = client.user.id;
    record('Browser-created client authenticates through hosted API', 'PASS');
    await check(
      'Client cannot become a designer',
      'PATCH',
      '/users/me/active-role',
      client,
      { activeRole: 'DESIGNER' },
      403,
    );
    fixture.designerEmail = `qa-designer-${run}@inside.test`;
    fixture.otherEmail = `qa-other-${run}@inside.test`;
    designer = await register(
      fixture.designerEmail,
      'DESIGNER',
      `QA Flow Designer ${run}`,
    );
    other = await register(
      fixture.otherEmail,
      'DESIGNER',
      `QA Other Designer ${run}`,
    );
    fixture.designerId = designer.user.id;
    fixture.otherId = other.user.id;
    await check(
      'Invalid login rejected',
      'POST',
      '/auth/login',
      null,
      { email: fixture.clientEmail, password: 'InvalidTestPassword!' },
      401,
    );
    await check(
      'Suspended demo login rejected',
      'POST',
      '/auth/login',
      null,
      { email: 'suspended.client@inside.test', password: 'Password123!' },
      401,
    );
    await check(
      'Client cannot access admin',
      'GET',
      '/admin/users',
      client,
      undefined,
      403,
    );
    await check(
      'Designer can switch to client mode',
      'PATCH',
      '/users/me/active-role',
      designer,
      { activeRole: 'CLIENT' },
    );
    await check(
      'Client mode cannot create portfolios',
      'POST',
      '/portfolios',
      designer,
      { title: 'QA forbidden', style: 'Scandinavian', roomType: 'Living Room' },
      403,
    );
    await check(
      'Designer can switch back',
      'PATCH',
      '/users/me/active-role',
      designer,
      { activeRole: 'DESIGNER' },
    );
    const portfolios = await check(
      'Public portfolios load',
      'GET',
      '/portfolios',
    );
    fixture.fileUrl = portfolios.items
      .flatMap((item) => item.images ?? [])
      .find((image) => image.imageUrl)?.imageUrl;
    assert.ok(
      fixture.fileUrl,
      'A public portfolio image is required for this QA fixture.',
    );
    const portfolio = await check(
      'Designer publishes a QA portfolio',
      'POST',
      '/portfolios',
      designer,
      {
        title: `QA Scandinavian room ${run}`,
        description: 'QA only: calm oak living room',
        style: 'Scandinavian',
        roomType: 'Living Room',
        budget: 500,
        images: [{ imageUrl: fixture.fileUrl }],
      },
      201,
    );
    fixture.portfolioId = portfolio.portfolio.id;
    await check(
      'Portfolio keyword filter',
      'GET',
      `/portfolios?q=${encodeURIComponent(run)}`,
      null,
      undefined,
      200,
      (data) =>
        assert.ok(data.items.some((item) => item.id === fixture.portfolioId)),
    );
    const moodboard = await check(
      'Client creates a moodboard',
      'POST',
      '/moodboards',
      client,
      { name: `QA inspiration ${run}` },
      201,
    );
    fixture.moodboardId = moodboard.moodboard.id;
    await check(
      'Client saves portfolio inspiration',
      'POST',
      `/moodboards/${fixture.moodboardId}/items`,
      client,
      {
        imageUrl: fixture.fileUrl,
        portfolioId: fixture.portfolioId,
        note: 'Calm Scandinavian oak room',
      },
      201,
    );
    const brief = await check(
      'Moodboard generates a brief',
      'POST',
      `/moodboards/${fixture.moodboardId}/briefs`,
      client,
      { budgetRange: '400-600', description: 'QA only: calm oak living room' },
      201,
    );
    fixture.briefId = brief.brief.id;
    await check(
      'Generated brief keeps inspiration',
      'GET',
      `/briefs/${fixture.briefId}`,
      client,
      undefined,
      200,
      (data) => assert.equal(data.brief.moodboardId, fixture.moodboardId),
    );
  }
  if (mode === 'prepare' || mode === 'prepare-rest') {
    if (mode === 'prepare-rest') await actors();
    results = results.map((row) =>
      row.name === 'Generated brief keeps inspiration' && row.status === 'FAIL'
        ? {
            ...row,
            status: 'GAP',
            detail:
              'Linked portfolio style/room are not inferred; service defaults to Mixed/General. Explicit brief editing is needed.',
          }
        : row,
    );
    await check(
      'Client edits generated brief styles and rooms',
      'PATCH',
      `/briefs/${fixture.briefId}`,
      client,
      {
        styles: ['Scandinavian'],
        rooms: ['Living Room'],
        budgetRange: '400-600',
      },
    );
    await check(
      'Another account cannot read the brief',
      'GET',
      `/briefs/${fixture.briefId}`,
      other,
      undefined,
      403,
    );
    await check(
      'Matching recommends the QA designer',
      'GET',
      `/match/designers?briefId=${fixture.briefId}`,
      client,
      undefined,
      200,
      (data) =>
        assert.ok(
          data.items.some((item) => item.designer.id === fixture.designerId),
        ),
    );
    await check(
      'Save favourite designer',
      'POST',
      '/favourites',
      client,
      { designerId: fixture.designerId },
      201,
    );
    await check(
      'Duplicate favourite rejected',
      'POST',
      '/favourites',
      client,
      { designerId: fixture.designerId },
      409,
    );
    const request = await check(
      'Client posts an open request',
      'POST',
      '/requests',
      client,
      {
        title: fixture.title,
        description: 'Hosted QA only; no actual design engagement.',
        type: 'OPEN',
        budget: 500,
        briefId: fixture.briefId,
        timeline: '6 weeks',
      },
      201,
    );
    fixture.requestId = request.request.id;
    const proposal = await check(
      'Designer submits a staged proposal',
      'POST',
      `/requests/${fixture.requestId}/proposals`,
      designer,
      scope,
      201,
    );
    fixture.proposalId = proposal.proposal.id;
    await check(
      'Second designer offers a comparison proposal',
      'POST',
      `/requests/${fixture.requestId}/proposals`,
      other,
      { ...scope, scope: `QA alternative ${run}` },
      201,
    );
    await check(
      'Client sees both proposals',
      'GET',
      `/requests/${fixture.requestId}/proposals`,
      client,
      undefined,
      200,
      (data) => assert.equal(data.items.length, 2),
    );
    const direct = await check(
      'Client sends a direct request',
      'POST',
      '/requests',
      client,
      {
        title: `QA declined request ${run}`,
        type: 'DIRECT',
        designerId: fixture.designerId,
      },
      201,
    );
    await check(
      'Designer declines the direct request',
      'PATCH',
      `/requests/${direct.request.id}/decline`,
      designer,
      undefined,
      200,
      (data) => assert.equal(data.request.status, 'REJECTED'),
    );
    record(
      'Prepared request for browser comparison and acceptance',
      'PASS',
      fixture.requestId,
    );
  } else if (mode !== 'prepare') {
    await actors();
    const projects = await check(
      'Client project list',
      'GET',
      '/projects',
      client,
    );
    const project = projects.items.find((item) => item.title === fixture.title);
    assert.ok(
      project,
      'Accept the prepared proposal through the browser before running this phase.',
    );
    fixture.projectId = project.id;
    await check(
      'Project has five ordered stages',
      'GET',
      `/projects/${project.id}/stages`,
      client,
      undefined,
      200,
      (data) =>
        assert.deepEqual(
          data.items.map((stage) => stage.name),
          stageNames,
        ),
    );
    if (mode === 'extras') {
      results = results.map((row) =>
        row.name === 'Concurrency QA proposal creation' &&
        row.status === 'FAIL' &&
        row.detail.includes('You cannot interact')
          ? {
              ...row,
              name: 'Blocking rejects QA outsider proposal',
              status: 'PASS',
              detail:
                'Earlier block correctly rejected the first supplement attempt. Test fixture is unblocked before retrying concurrency.',
            }
          : row,
      );
      await check(
        'Completed project cannot be cancelled',
        'PATCH',
        `/projects/${project.id}/cancel`,
        client,
        { reason: 'QA negative test' },
        400,
      );
      await check(
        'Outsider cannot read project messages',
        'GET',
        `/projects/${project.id}/messages`,
        other,
        undefined,
        403,
      );
      await check(
        'Client cannot upload designer deliverables',
        'POST',
        `/stages/${project.stages[0].id}/deliverables`,
        client,
        { fileUrl: fixture.fileUrl },
        403,
      );
      await check(
        'Password recovery returns a neutral response',
        'POST',
        '/auth/forgot-password',
        null,
        { email: fixture.clientEmail },
        201,
        (data) => assert.equal(data.resetToken, undefined),
      );
      if (!fixture.concurrentRequestId) {
        const concurrentRequest = await check(
          'Concurrency QA request creation',
          'POST',
          '/requests',
          client,
          { title: `QA concurrency ${run}`, type: 'OPEN', budget: 500 },
          201,
        );
        fixture.concurrentRequestId = concurrentRequest.request.id;
      }
      await check(
        'Client removes test-only block before concurrency',
        'DELETE',
        `/blocks/${fixture.otherId}`,
        client,
      );
      const existing = await check(
        'Read existing QA comparison proposals',
        'GET',
        `/requests/${fixture.concurrentRequestId}/proposals`,
        client,
      );
      const concurrentProposals = [];
      for (const actor of [designer, other]) {
        const prior = existing.items.find(
          (item) => item.designerId === actor.user.id,
        );
        if (prior) concurrentProposals.push(prior.id);
        else {
          const proposal = await check(
            'Concurrency QA proposal creation',
            'POST',
            `/requests/${fixture.concurrentRequestId}/proposals`,
            actor,
            scope,
            201,
          );
          concurrentProposals.push(proposal.proposal.id);
        }
      }
      const acceptances = await Promise.all(
        concurrentProposals.map((id) =>
          http('PATCH', `/proposals/${id}/accept`, client),
        ),
      );
      assert.equal(
        acceptances.filter((response) => response.status === 200).length,
        1,
      );
      assert.ok(
        acceptances.some((response) => [400, 409].includes(response.status)),
      );
      record('Concurrent hiring creates exactly one project', 'PASS');
      const concurrentProject = acceptances.find(
        (response) => response.status === 200,
      ).body.data.project;
      await check(
        'QA concurrency project can be cancelled',
        'PATCH',
        `/projects/${concurrentProject.id}/cancel`,
        client,
        { reason: 'QA test finished; no real engagement or payment.' },
      );
      await check(
        'QA cancellation persisted',
        'GET',
        `/projects/${concurrentProject.id}`,
        client,
        undefined,
        200,
        (data) => assert.equal(data.project.status, 'CANCELLED'),
      );
      await check(
        'QA outsider unavailable for new work',
        'PATCH',
        '/users/me',
        other,
        { isAvailable: false },
      );
      if (admin) {
        const verification = await check(
          'QA designer submits verification',
          'POST',
          '/verifications',
          designer,
          {
            evidenceUrl: fixture.fileUrl,
            notes: `QA TEST ONLY ${run}; not a genuine professional qualification.`,
          },
          201,
        );
        await check(
          'Admin approves only QA verification',
          'PATCH',
          `/verifications/${verification.verification.id}/approve`,
          admin,
        );
        await check(
          'Verified badge state persisted',
          'GET',
          '/users/me',
          designer,
          undefined,
          200,
          (data) => assert.equal(data.user.isVerified, true),
        );
        await check(
          'QA verified badge removed after test',
          'PATCH',
          `/admin/users/${fixture.designerId}/revoke-verification`,
          admin,
        );
        await check(
          'QA profile remains unverified',
          'GET',
          '/users/me',
          designer,
          undefined,
          200,
          (data) => assert.equal(data.user.isVerified, false),
        );
      }
    } else if (mode === 'hold') {
      await check(
        'Browser pause persisted',
        'GET',
        `/projects/${project.id}`,
        client,
        undefined,
        200,
        (data) => assert.equal(data.project.status, 'ON_HOLD'),
      );
      await check(
        'Other party cannot resume client pause',
        'PATCH',
        `/projects/${project.id}/resume`,
        designer,
        undefined,
        403,
      );
      await check(
        'Paused project cannot submit stages',
        'PATCH',
        `/stages/${project.stages[1].id}/submit`,
        designer,
        undefined,
        400,
      );
    } else if (mode === 'submit') {
      await check(
        'Non-party cannot access project',
        'GET',
        `/projects/${project.id}`,
        other,
        undefined,
        403,
      );
      await check(
        'Client cannot start designer stage',
        'PATCH',
        `/stages/${project.stages[0].id}/start`,
        client,
        undefined,
        403,
      );
      const signed = await http('POST', '/uploads/signature', designer, {
        folder: 'deliverables',
      });
      if (signed.status === 201 || signed.status === 200) {
        const data = signed.body.data;
        const form = new FormData();
        for (const [key, value] of Object.entries(data.params))
          form.append(key, String(value));
        form.append(
          'file',
          new Blob([await readFile('apps/mobile/assets/favicon.png')], {
            type: 'image/png',
          }),
          `QA-${run}.png`,
        );
        const upload = await fetch(
          `https://api.cloudinary.com/v1_1/${encodeURIComponent(data.cloudName)}/${data.resourceType}/upload`,
          { method: 'POST', body: form, signal: AbortSignal.timeout(40_000) },
        );
        const result = await upload.json();
        if (upload.ok && result.secure_url) {
          fixture.fileUrl = result.secure_url;
          record('Real Cloudinary upload', 'PASS');
        } else
          record(
            'Real Cloudinary upload',
            'BLOCKED',
            result.error?.message ?? `HTTP ${upload.status}`,
          );
      } else
        record(
          'Real Cloudinary upload',
          'BLOCKED',
          signed.body?.error?.message ?? `HTTP ${signed.status}`,
        );
      await prepareStage(project.stages[0]);
      record(
        'First stage submitted for browser feedback and approval',
        'PASS',
        project.stages[0].id,
      );
    } else {
      let stages = (
        await check(
          'Current stages',
          'GET',
          `/projects/${project.id}/stages`,
          client,
        )
      ).items;
      for (let index = 0; index < stages.length; index++) {
        const stage = stages[index];
        if (stage.status === 'APPROVED') {
          record(`${stage.name} browser approval persisted`, 'PASS');
          continue;
        }
        if (stage.status !== 'SUBMITTED') await prepareStage(stage);
        if (index === 1) {
          await check(
            'Rejection requires meaningful feedback',
            'PATCH',
            `/stages/${stage.id}/reject`,
            client,
            { reason: '' },
            400,
          );
          await check(
            'Client requests a revision',
            'PATCH',
            `/stages/${stage.id}/reject`,
            client,
            { reason: `QA revision feedback ${run}` },
          );
          await check(
            'Resubmission needs a new version',
            'PATCH',
            `/stages/${stage.id}/submit`,
            designer,
            undefined,
            400,
          );
          await check(
            'Designer adds version two',
            'POST',
            `/stages/${stage.id}/deliverables`,
            designer,
            { fileUrl: fixture.fileUrl, fileName: 'QA-revised-concept.png' },
            201,
            (data) => assert.equal(data.deliverable.version, 2),
          );
          await check(
            'Revised stage resubmits',
            'PATCH',
            `/stages/${stage.id}/submit`,
            designer,
          );
        }
        await check(
          `${stage.name} approval`,
          'PATCH',
          `/stages/${stage.id}/approve`,
          client,
          undefined,
          200,
          (data) => assert.equal(data.stage.status, 'APPROVED'),
        );
        await check(
          `${stage.name} duplicate approval rejected`,
          'PATCH',
          `/stages/${stage.id}/approve`,
          client,
          undefined,
          400,
        );
        stages = (
          await check(
            `${stage.name} advancement persisted`,
            'GET',
            `/projects/${project.id}/stages`,
            client,
          )
        ).items;
      }
      await check(
        'Project completion persisted',
        'GET',
        `/projects/${project.id}`,
        client,
        undefined,
        200,
        (data) => assert.equal(data.project.status, 'COMPLETED'),
      );
      const payments = await check(
        'Five pending milestone records exist',
        'GET',
        `/projects/${project.id}/payments`,
        client,
        undefined,
        200,
        (data) => {
          assert.equal(data.items.length, 5);
          assert.ok(
            data.items.every(
              (payment) =>
                payment.status === 'PENDING' && payment.amount === 100,
            ),
          );
        },
      );
      record(
        'Settlement before completion',
        'GAP',
        'Project completes with all five milestones unpaid; no money transferred during testing.',
      );
      await check(
        'Unpaid milestone cannot be released',
        'PATCH',
        `/payments/${payments.items[0].id}/release`,
        client,
        undefined,
        400,
      );
      await check(
        'Designer cannot create client checkout',
        'POST',
        `/payments/${payments.items[0].id}/checkout`,
        designer,
        undefined,
        403,
      );
      const checkout = await http(
        'POST',
        `/payments/${payments.items[0].id}/checkout`,
        client,
      );
      if (
        checkout.status === 201 &&
        checkout.body?.data?.url?.startsWith('https://checkout.stripe.com/')
      )
        record(
          'Stripe Checkout creation',
          'PASS',
          'Checkout URL created; no charge or payment confirmation performed.',
        );
      else
        record(
          'Stripe Checkout creation',
          'BLOCKED',
          checkout.body?.error?.message ?? `HTTP ${checkout.status}`,
        );
      const message = await check(
        'Client sends a project message',
        'POST',
        `/projects/${project.id}/messages`,
        client,
        { content: `QA hosted message ${run}` },
        201,
      );
      await check(
        'Designer receives the message',
        'GET',
        `/projects/${project.id}/messages`,
        designer,
        undefined,
        200,
        (data) =>
          assert.ok(data.items.some((item) => item.id === message.message.id)),
      );
      await check(
        'Designer marks message read',
        'PATCH',
        `/messages/${message.message.id}/read`,
        designer,
      );
      const notifications = await check(
        'Designer receives notifications',
        'GET',
        '/notifications',
        designer,
        undefined,
        200,
        (data) =>
          assert.ok(
            data.items.some((item) => item.metadata?.projectId === project.id),
          ),
      );
      const mine = notifications.items.find(
        (item) => item.metadata?.projectId === project.id,
      );
      await check(
        'Notification read state updates',
        'PATCH',
        `/notifications/${mine.id}/read`,
        designer,
      );
      await check(
        'History contains approvals and completion',
        'GET',
        `/projects/${project.id}/activity`,
        client,
        undefined,
        200,
        (data) =>
          assert.ok(
            data.items.some((item) => item.action === 'PROJECT_COMPLETED'),
          ),
      );
      const review = await check(
        'Client reviews completed project',
        'POST',
        `/projects/${project.id}/reviews`,
        client,
        { rating: 5, comment: `QA AUTOMATED TEST ONLY ${run}` },
        201,
      );
      fixture.reviewId = review.review.id;
      await check(
        'Duplicate review rejected',
        'POST',
        `/projects/${project.id}/reviews`,
        client,
        { rating: 5 },
        409,
      );
      await check(
        'Review hidden before moderation',
        'GET',
        `/designers/${fixture.designerId}/reviews`,
        null,
        undefined,
        200,
        (data) =>
          assert.ok(!data.items.some((item) => item.id === fixture.reviewId)),
      );
      await check(
        'Client blocks QA outsider',
        'POST',
        '/blocks',
        client,
        { blockedId: fixture.otherId },
        201,
      );
      await check(
        'Duplicate block rejected',
        'POST',
        '/blocks',
        client,
        { blockedId: fixture.otherId },
        409,
      );
      await check(
        'Blocking excludes designer from matching',
        'GET',
        `/match/designers?briefId=${fixture.briefId}`,
        client,
        undefined,
        200,
        (data) =>
          assert.ok(
            !data.items.some((item) => item.designer.id === fixture.otherId),
          ),
      );
      const report = await check(
        'Client reports a QA test account',
        'POST',
        '/reports',
        client,
        {
          targetType: 'USER',
          targetId: fixture.otherId,
          reportedUserId: fixture.otherId,
          reason: `QA test report only ${run}`,
        },
        201,
      );
      if (admin) {
        record('Administrator authentication', 'PASS');
        await check(
          'Admin publishes QA review',
          'PATCH',
          `/admin/reviews/${fixture.reviewId}/visibility`,
          admin,
          { isVisible: true },
        );
        await check(
          'Published QA review is visible',
          'GET',
          `/designers/${fixture.designerId}/reviews`,
          null,
          undefined,
          200,
          (data) =>
            assert.ok(data.items.some((item) => item.id === fixture.reviewId)),
        );
        await check(
          'Admin hides QA review after test',
          'PATCH',
          `/admin/reviews/${fixture.reviewId}/visibility`,
          admin,
          { isVisible: false },
        );
        await check(
          'Admin marks QA report under review',
          'PATCH',
          `/admin/reports/${report.report.id}/under-review`,
          admin,
        );
        await check(
          'Admin resolves QA report',
          'PATCH',
          `/admin/reports/${report.report.id}/resolve`,
          admin,
        );
        await check(
          'Admin audit log available',
          'GET',
          '/admin/activity',
          admin,
        );
        await check(
          'Admin suspends only QA outsider',
          'PATCH',
          `/admin/users/${fixture.otherId}/suspend`,
          admin,
        );
        await check(
          'Suspended account session rejected',
          'GET',
          '/users/me',
          other,
          undefined,
          401,
        );
        await check(
          'Suspended account refresh rejected',
          'POST',
          '/auth/refresh',
          null,
          { refreshToken: other.refreshToken },
          401,
        );
        await check(
          'Admin reactivates QA outsider',
          'PATCH',
          `/admin/users/${fixture.otherId}/reactivate`,
          admin,
        );
      }
      await check(
        'QA designer hidden from new matches',
        'PATCH',
        '/users/me',
        designer,
        { isAvailable: false },
      );
      await check(
        'QA portfolio unpublished after test',
        'PATCH',
        `/portfolios/${fixture.portfolioId}`,
        designer,
        { isPublished: false },
      );
      const rotated = await check(
        'Refresh token rotates',
        'POST',
        '/auth/refresh',
        null,
        { refreshToken: client.refreshToken },
        201,
      );
      await check(
        'Old refresh token cannot be reused',
        'POST',
        '/auth/refresh',
        null,
        { refreshToken: client.refreshToken },
        401,
      );
      await check(
        'Logout revokes fresh session',
        'POST',
        '/auth/logout',
        null,
        { refreshToken: rotated.refreshToken },
        201,
      );
      await check(
        'Logged-out access token rejected',
        'GET',
        '/users/me',
        rotated,
        undefined,
        401,
      );
      record(
        'External email delivery, native push and real Stripe settlement',
        'NOT_TESTED',
        'Not implemented or not authorized as a real financial transaction.',
      );
    }
  }
} catch (error) {
  console.error(`Flow stopped: ${error.message}`);
  process.exitCode = 1;
} finally {
  await writeFile(fixturePath, JSON.stringify(fixture, null, 2));
  await writeFile(resultPath, JSON.stringify(results, null, 2));
  console.log(
    JSON.stringify({
      run,
      mode,
      fixture: fixturePath,
      results: resultPath,
      summary: results.reduce(
        (counts, row) => ({
          ...counts,
          [row.status]: (counts[row.status] ?? 0) + 1,
        }),
        {},
      ),
    }),
  );
}
