import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, StageName } from '@inside/database';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { fulfilStageRequirements } from './stage-requirements';

const password = 'Password123!';

const stageFees = [
  { name: StageName.PROPOSAL, fee: 10000 },
  { name: StageName.CONCEPT, fee: 20000 },
  { name: StageName.DESIGN, fee: 30000 },
  { name: StageName.REVISION, fee: 15000 },
  { name: StageName.COMPLETION, fee: 25000 },
];

const proposalBody = {
  scope: 'Concept, design and styling.',
  timeline: '6 weeks',
  stageFees,
};

type Account = { id: string; token: string; refreshToken: string };

/**
 * Covers the hiring, workspace, trust and platform flows added on top of the
 * original happy paths in hiring.e2e-spec.ts and workspace.e2e-spec.ts.
 */
describe('Platform flows (e2e)', () => {
  jest.setTimeout(120_000);

  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = Date.now();
  const emails = {
    client: `flow-client-${suffix}@insidesign.me`,
    designer: `flow-designer-${suffix}@insidesign.me`,
    designer2: `flow-designer2-${suffix}@insidesign.me`,
    admin: `flow-admin-${suffix}@insidesign.me`,
  };
  const newsletterEmail = `flow-news-${suffix}@example.com`;

  let client: Account;
  let designer: Account;
  let designer2: Account;
  let admin: Account;

  const server = () => app.getHttpServer();
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function register(
    email: string,
    role: 'CLIENT' | 'DESIGNER',
  ): Promise<Account> {
    const res = await request(server())
      .post('/auth/register')
      .send({ email, password, name: `Flow ${role}`, role })
      .expect(201);
    return {
      id: res.body.data.user.id,
      token: res.body.data.accessToken,
      refreshToken: res.body.data.refreshToken,
    };
  }

  async function login(email: string): Promise<Account> {
    const res = await request(server())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);
    return {
      id: res.body.data.user.id,
      token: res.body.data.accessToken,
      refreshToken: res.body.data.refreshToken,
    };
  }

  async function createRequest(
    body: Record<string, unknown>,
    token = client.token,
  ): Promise<string> {
    const res = await request(server())
      .post('/requests')
      .set(auth(token))
      .send({ title: 'Flow request', budget: 100000, ...body })
      .expect(201);
    return res.body.data.request.id;
  }

  async function propose(requestId: string, token: string): Promise<string> {
    const res = await request(server())
      .post(`/requests/${requestId}/proposals`)
      .set(auth(token))
      .send(proposalBody)
      .expect(201);
    return res.body.data.proposal.id;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);

    client = await register(emails.client, 'CLIENT');
    designer = await register(emails.designer, 'DESIGNER');
    designer2 = await register(emails.designer2, 'DESIGNER');

    await prisma.user.create({
      data: {
        email: emails.admin,
        passwordHash: await bcrypt.hash(password, 10),
        name: 'Flow Admin',
        role: Role.ADMIN,
        activeRole: Role.ADMIN,
      },
    });
    admin = await login(emails.admin);
  });

  afterAll(async () => {
    const users = await prisma.user.findMany({
      where: { email: { in: Object.values(emails) } },
      select: { id: true },
    });
    const ids = users.map((user) => user.id);
    await prisma.milestonePayment.deleteMany({
      where: {
        project: {
          OR: [{ clientId: { in: ids } }, { designerId: { in: ids } }],
        },
      },
    });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await prisma.newsletterSubscriber.deleteMany({
      where: { email: newsletterEmail },
    });
    await app.close();
  });

  describe('hiring', () => {
    it('lets a designer decline a direct request and notifies the client', async () => {
      const requestId = await createRequest({
        type: 'DIRECT',
        designerId: designer.id,
        timeline: '4 weeks',
      });

      const declined = await request(server())
        .patch(`/requests/${requestId}/decline`)
        .set(auth(designer.token))
        .expect(200);
      expect(declined.body.data.request.status).toBe('REJECTED');

      await request(server())
        .patch(`/requests/${requestId}/decline`)
        .set(auth(designer.token))
        .expect(400);

      const notes = await request(server())
        .get('/notifications')
        .set(auth(client.token))
        .expect(200);
      expect(
        notes.body.data.items.map((n: { title: string }) => n.title),
      ).toContain('Request declined');
    });

    it('lets a designer revise and resubmit a rejected proposal', async () => {
      const requestId = await createRequest({
        type: 'DIRECT',
        designerId: designer.id,
      });
      const proposalId = await propose(requestId, designer.token);

      await request(server())
        .patch(`/proposals/${proposalId}/reject`)
        .set(auth(client.token))
        .expect(200);

      const resubmitted = await request(server())
        .post(`/requests/${requestId}/proposals`)
        .set(auth(designer.token))
        .send({ ...proposalBody, scope: 'Revised scope.' })
        .expect(201);
      expect(resubmitted.body.data.proposal.id).toBe(proposalId);
      expect(resubmitted.body.data.proposal.status).toBe('PENDING');
    });

    it('rejects duplicate stage fees', async () => {
      const requestId = await createRequest({ type: 'OPEN' });
      await request(server())
        .post(`/requests/${requestId}/proposals`)
        .set(auth(designer.token))
        .send({
          ...proposalBody,
          stageFees: [
            { name: StageName.CONCEPT, fee: 1000 },
            { name: StageName.CONCEPT, fee: 2000 },
          ],
        })
        .expect(400);
    });

    it('stops a designer proposing on their own open request', async () => {
      await request(server())
        .post('/users/me/client-account')
        .set(auth(designer.token))
        .expect(201);
      const toClient = await request(server())
        .patch('/users/me/active-role')
        .set(auth(designer.token))
        .send({ activeRole: 'CLIENT' })
        .expect(200);
      const requestId = await createRequest(
        { type: 'OPEN' },
        toClient.body.data.accessToken,
      );

      const toDesigner = await request(server())
        .patch('/users/me/active-role')
        .set(auth(designer.token))
        .send({ activeRole: 'DESIGNER' })
        .expect(200);
      designer.token = toDesigner.body.data.accessToken;

      await request(server())
        .post(`/requests/${requestId}/proposals`)
        .set(auth(designer.token))
        .send(proposalBody)
        .expect(403);

      const feed = await request(server())
        .get('/requests')
        .set(auth(designer.token))
        .expect(200);
      expect(
        feed.body.data.items.map((item: { id: string }) => item.id),
      ).not.toContain(requestId);
      expect(feed.body.data).toHaveProperty('total');
    });

    it('lets only one of two simultaneous accepts create a project', async () => {
      const requestId = await createRequest({ type: 'OPEN' });
      const first = await propose(requestId, designer.token);
      const second = await propose(requestId, designer2.token);

      const results = await Promise.all(
        [first, second].map((id) =>
          request(server())
            .patch(`/proposals/${id}/accept`)
            .set(auth(client.token)),
        ),
      );
      const statuses = results.map((res) => res.status).sort();
      expect(statuses[0]).toBe(200);
      expect([400, 409]).toContain(statuses[1]);

      const projects = await prisma.project.count({
        where: { proposal: { requestId } },
      });
      expect(projects).toBe(1);
    });
  });

  describe('workspace', () => {
    let projectId = '';
    let stageId = '';

    beforeAll(async () => {
      const requestId = await createRequest({
        type: 'DIRECT',
        designerId: designer.id,
      });
      const proposalId = await propose(requestId, designer.token);
      const accepted = await request(server())
        .patch(`/proposals/${proposalId}/accept`)
        .set(auth(client.token))
        .expect(200);
      projectId = accepted.body.data.project.id;
      stageId = accepted.body.data.project.stages[0].id;
    });

    it('requires deliverables and rejection feedback, and records the revision cycle', async () => {
      await request(server())
        .patch(`/stages/${stageId}/start`)
        .set(auth(designer.token))
        .expect(400);
      await prisma.milestonePayment.updateMany({
        where: { stageId },
        data: { status: 'PAID', paidAt: new Date() },
      });
      await request(server())
        .patch(`/stages/${stageId}/start`)
        .set(auth(designer.token))
        .expect(200);

      await request(server())
        .patch(`/stages/${stageId}/submit`)
        .set(auth(designer.token))
        .expect(400);

      await request(server())
        .post(`/stages/${stageId}/deliverables`)
        .set(auth(designer.token))
        .send({ fileUrl: 'javascript:alert(1)' })
        .expect(400);

      await request(server())
        .post(`/stages/${stageId}/deliverables`)
        .set(auth(designer.token))
        .send({ fileUrl: 'https://res.cloudinary.com/e2e/proposal-v1.pdf' })
        .expect(201);
      await request(server())
        .patch(`/stages/${stageId}/submit`)
        .set(auth(designer.token))
        .expect(400);
      await fulfilStageRequirements(
        server(),
        projectId,
        stageId,
        designer.token,
        client.token,
      );
      await request(server())
        .patch(`/stages/${stageId}/submit`)
        .set(auth(designer.token))
        .expect(200);

      await request(server())
        .patch(`/stages/${stageId}/reject`)
        .set(auth(client.token))
        .send({})
        .expect(400);
      const reason = 'Please add a second layout option.';
      await request(server())
        .patch(`/stages/${stageId}/reject`)
        .set(auth(client.token))
        .send({ reason })
        .expect(200);

      await request(server())
        .patch(`/stages/${stageId}/submit`)
        .set(auth(designer.token))
        .expect(400);
      await request(server())
        .post(`/stages/${stageId}/deliverables`)
        .set(auth(designer.token))
        .send({ fileUrl: 'https://res.cloudinary.com/e2e/proposal-v2.pdf' })
        .expect(201);
      await request(server())
        .patch(`/stages/${stageId}/submit`)
        .set(auth(designer.token))
        .expect(200);
      await request(server())
        .patch(`/stages/${stageId}/approve`)
        .set(auth(client.token))
        .expect(200);

      const history = await request(server())
        .get(`/projects/${projectId}/activity`)
        .set(auth(client.token))
        .expect(200);
      const actions = history.body.data.items.map(
        (item: { action: string }) => item.action,
      );
      expect(actions).toEqual(
        expect.arrayContaining([
          'PROPOSAL_ACCEPTED',
          'DELIVERABLE_UPLOADED',
          'STAGE_SUBMITTED',
          'STAGE_REJECTED',
          'STAGE_APPROVED',
        ]),
      );
      const rejection = history.body.data.items.find(
        (item: { action: string }) => item.action === 'STAGE_REJECTED',
      );
      expect(rejection.metadata.reason).toBe(reason);

      const payments = await request(server())
        .get(`/projects/${projectId}/payments`)
        .set(auth(client.token))
        .expect(200);
      const stagePayment = payments.body.data.items.find(
        (item: { stageId: string }) => item.stageId === stageId,
      );
      expect(stagePayment.status).toBe('RELEASED');
    });

    it('lets either party resume a paused project, and requires a cancel reason', async () => {
      await request(server())
        .patch(`/projects/${projectId}/on-hold`)
        .set(auth(designer.token))
        .send({})
        .expect(200);
      await request(server())
        .patch(`/projects/${projectId}/resume`)
        .set(auth(client.token))
        .send({})
        .expect(200);

      await request(server())
        .patch(`/projects/${projectId}/cancel`)
        .set(auth(client.token))
        .send({})
        .expect(400);
      const cancelled = await request(server())
        .patch(`/projects/${projectId}/cancel`)
        .set(auth(client.token))
        .send({ reason: 'Budget moved to another room.' })
        .expect(200);
      expect(cancelled.body.data.project.status).toBe('CANCELLED');
    });
  });

  describe('auth and platform', () => {
    it('revokes the access token on logout and refuses a reused refresh token', async () => {
      const session = await login(emails.client);
      await request(server())
        .get('/users/me')
        .set(auth(session.token))
        .expect(200);

      const rotated = await request(server())
        .post('/auth/refresh')
        .send({ refreshToken: session.refreshToken })
        .expect(201);
      await request(server())
        .post('/auth/refresh')
        .send({ refreshToken: session.refreshToken })
        .expect(401);

      await request(server())
        .post('/auth/logout')
        .send({ refreshToken: rotated.body.data.refreshToken })
        .expect(201);
      await request(server())
        .get('/users/me')
        .set(auth(rotated.body.data.accessToken))
        .expect(401);
    });

    it('shows the activity feed to admins only', async () => {
      const feed = await request(server())
        .get('/admin/activity?pageSize=5')
        .set(auth(admin.token))
        .expect(200);
      expect(feed.body.data.items.length).toBeGreaterThan(0);
      expect(feed.body.data.pageSize).toBe(5);

      await request(server())
        .get('/admin/activity')
        .set(auth(client.token))
        .expect(403);
    });

    it('signs uploads only for the roles allowed to use each folder', async () => {
      await request(server())
        .post('/uploads/signature')
        .set(auth(client.token))
        .send({ folder: 'portfolios' })
        .expect(403);

      const signed = await request(server())
        .post('/uploads/signature')
        .set(auth(designer.token))
        .send({ folder: 'portfolios' })
        .expect(201);
      expect(signed.body.data.params.signature).toHaveLength(40);
      expect(signed.body.data.params.allowed_formats).not.toContain('svg');

      await request(server())
        .post('/uploads/signature')
        .set(auth(client.token))
        .send({ folder: 'attachments' })
        .expect(201);
    });

    it('only accepts reports about things that exist', async () => {
      await request(server())
        .post('/reports')
        .set(auth(client.token))
        .send({
          targetType: 'USER',
          targetId: '00000000-0000-4000-8000-00000000abcd',
          reason: 'Spam',
        })
        .expect(404);
      await request(server())
        .post('/reports')
        .set(auth(client.token))
        .send({ targetType: 'USER', targetId: designer2.id, reason: 'Spam' })
        .expect(201);
    });

    it('subscribes to the newsletter once, however many times it is sent', async () => {
      for (let i = 0; i < 2; i++) {
        await request(server())
          .post('/newsletter/subscribe')
          .send({ email: newsletterEmail })
          .expect(201);
      }
      expect(
        await prisma.newsletterSubscriber.count({
          where: { email: newsletterEmail },
        }),
      ).toBe(1);

      await request(server())
        .post('/newsletter/subscribe')
        .send({ email: 'not-an-email' })
        .expect(400);
    });
  });
});
