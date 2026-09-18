import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AccountStatus,
  PaymentStatus,
  ProjectStatus,
  Role,
  StageName,
  StageStatus,
  VerificationStatus,
} from '@inside/database';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const password = 'Password123!';

describe('Workspace flow (e2e)', () => {
  jest.setTimeout(120_000);

  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = Date.now();
  const clientEmail = `ws-client-${suffix}@inside.test`;
  const designerEmail = `ws-designer-${suffix}@inside.test`;
  const adminEmail = `ws-admin-${suffix}@inside.test`;
  const otherEmail = `ws-other-${suffix}@inside.test`;

  let clientToken = '';
  let designerToken = '';
  let adminToken = '';
  let otherToken = '';
  let clientId = '';
  let designerId = '';
  let otherId = '';
  let projectId = '';
  let stageIds: string[] = [];

  const stageFees = [
    { name: StageName.PROPOSAL, fee: 10000 },
    { name: StageName.CONCEPT, fee: 20000 },
    { name: StageName.DESIGN, fee: 30000 },
    { name: StageName.REVISION, fee: 15000 },
    { name: StageName.COMPLETION, fee: 25000 },
  ];

  const authHeader = (token: string) => ({
    Authorization: `Bearer ${token}`,
  });

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

    const client = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: clientEmail,
        password,
        name: 'WS Client',
        role: 'CLIENT',
      })
      .expect(201);
    clientToken = client.body.data.accessToken;
    clientId = client.body.data.user.id;

    const designer = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: designerEmail,
        password,
        name: 'WS Designer',
        role: 'DESIGNER',
      })
      .expect(201);
    designerToken = designer.body.data.accessToken;
    designerId = designer.body.data.user.id;

    const other = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: otherEmail,
        password,
        name: 'WS Other',
        role: 'CLIENT',
      })
      .expect(201);
    otherToken = other.body.data.accessToken;
    otherId = other.body.data.user.id;

    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash(password, 10),
        name: 'WS Admin',
        role: Role.ADMIN,
        activeRole: Role.ADMIN,
        isVerified: true,
      },
    });

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password })
      .expect(201);
    adminToken = adminLogin.body.data.accessToken;
  });

  afterAll(async () => {
    const emails = [clientEmail, designerEmail, adminEmail, otherEmail];
    for (const email of emails) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) continue;

      const projects = await prisma.project.findMany({
        where: { OR: [{ clientId: user.id }, { designerId: user.id }] },
      });
      for (const project of projects) {
        await prisma.milestonePayment.deleteMany({
          where: { projectId: project.id },
        });
        await prisma.deliverable.deleteMany({
          where: { stage: { projectId: project.id } },
        });
        await prisma.projectStage.deleteMany({
          where: { projectId: project.id },
        });
        await prisma.message.deleteMany({ where: { projectId: project.id } });
        await prisma.review.deleteMany({ where: { projectId: project.id } });
        await prisma.project.delete({ where: { id: project.id } });
      }
      await prisma.proposal.deleteMany({
        where: { OR: [{ designerId: user.id }] },
      });
      await prisma.projectRequest.deleteMany({
        where: { OR: [{ clientId: user.id }, { designerId: user.id }] },
      });
      await prisma.verification.deleteMany({ where: { designerId: user.id } });
      await prisma.notification.deleteMany({ where: { userId: user.id } });
      await prisma.report.deleteMany({
        where: {
          OR: [{ reporterId: user.id }, { reportedUserId: user.id }],
        },
      });
      await prisma.block.deleteMany({
        where: {
          OR: [{ blockerId: user.id }, { blockedId: user.id }],
        },
      });
      await prisma.session.deleteMany({ where: { userId: user.id } });
      await prisma.authToken.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    await app.close();
  });

  it('runs the full workspace flow', async () => {
    // 1. Client creates OPEN request
    const created = await request(app.getHttpServer())
      .post('/requests')
      .set(authHeader(clientToken))
      .send({
        title: 'Workspace flow',
        description: 'End-to-end test',
        type: 'OPEN',
        budget: 100000,
      })
      .expect(201);
    const requestId: string = created.body.data.request.id;

    // 2. Designer submits proposal
    const proposal = await request(app.getHttpServer())
      .post(`/requests/${requestId}/proposals`)
      .set(authHeader(designerToken))
      .send({
        scope: 'Full package',
        timeline: '10 weeks',
        stageFees,
      })
      .expect(201);
    const proposalId: string = proposal.body.data.proposal.id;

    // 3. Client accepts → project + 5 stages
    const accepted = await request(app.getHttpServer())
      .patch(`/proposals/${proposalId}/accept`)
      .set(authHeader(clientToken))
      .expect(200);
    projectId = accepted.body.data.project.id;
    stageIds = accepted.body.data.project.stages.map(
      (s: { id: string }) => s.id,
    );
    expect(stageIds).toHaveLength(5);

    // 4. Party access checks
    await request(app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set(authHeader(otherToken))
      .expect(403);

    const projectView = await request(app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set(authHeader(clientToken))
      .expect(200);
    expect(projectView.body.data.project.status).toBe(ProjectStatus.ACTIVE);

    // 5. Walk all five stages. First stage needs a manual start; subsequent
    //    stages auto-advance to IN_PROGRESS when the previous stage is approved.
    for (let i = 0; i < stageIds.length; i++) {
      const stageId = stageIds[i];

      if (i === 0) {
        const start = await request(app.getHttpServer())
          .patch(`/stages/${stageId}/start`)
          .set(authHeader(designerToken))
          .expect(200);
        expect(start.body.data.stage.status).toBe(StageStatus.IN_PROGRESS);
      }

      const deliv = await request(app.getHttpServer())
        .post(`/stages/${stageId}/deliverables`)
        .set(authHeader(designerToken))
        .send({ fileUrl: `https://cdn.test/stage-${i + 1}-v1.pdf` })
        .expect(201);
      expect(deliv.body.data.deliverable.version).toBe(1);

      const submit = await request(app.getHttpServer())
        .patch(`/stages/${stageId}/submit`)
        .set(authHeader(designerToken))
        .expect(200);
      expect(submit.body.data.stage.status).toBe(StageStatus.SUBMITTED);

      const approve = await request(app.getHttpServer())
        .patch(`/stages/${stageId}/approve`)
        .set(authHeader(clientToken))
        .expect(200);
      expect(approve.body.data.stage.status).toBe(StageStatus.APPROVED);

      // Pay the milestone that approve just created
      const payments = await request(app.getHttpServer())
        .get(`/projects/${projectId}/payments`)
        .set(authHeader(clientToken))
        .expect(200);
      const pending = payments.body.data.items.find(
        (p: { stageId: string; status: string }) =>
          p.stageId === stageId && p.status === PaymentStatus.PENDING,
      );
      expect(pending).toBeDefined();

      const paid = await request(app.getHttpServer())
        .patch(`/payments/${pending.id}/pay`)
        .set(authHeader(clientToken))
        .send({ stripeIntentId: `pi_test_${i}` })
        .expect(200);
      expect(paid.body.data.payment.status).toBe(PaymentStatus.PAID);
    }

    // 6. Project should be COMPLETED
    const finalProject = await request(app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set(authHeader(clientToken))
      .expect(200);
    expect(finalProject.body.data.project.status).toBe(ProjectStatus.COMPLETED);

    // 7. Client sends message; designer receives notification
    const msg = await request(app.getHttpServer())
      .post(`/projects/${projectId}/messages`)
      .set(authHeader(clientToken))
      .send({ content: 'Great work!' })
      .expect(201);
    expect(msg.body.data.message.receiverId).toBe(designerId);

    const messages = await request(app.getHttpServer())
      .get(`/projects/${projectId}/messages`)
      .set(authHeader(designerToken))
      .expect(200);
    expect(messages.body.data.items).toHaveLength(1);

    // 8. Client leaves a review
    const review = await request(app.getHttpServer())
      .post(`/projects/${projectId}/reviews`)
      .set(authHeader(clientToken))
      .send({ rating: 5, comment: 'Amazing designer' })
      .expect(201);
    expect(review.body.data.review.rating).toBe(5);

    const beforeApproval = await request(app.getHttpServer())
      .get(`/designers/${designerId}/reviews`)
      .expect(200);
    expect(beforeApproval.body.data.summary.count).toBe(0);

    await request(app.getHttpServer())
      .patch(`/admin/reviews/${review.body.data.review.id}/visibility`)
      .set(authHeader(adminToken))
      .send({ isVisible: true })
      .expect(200);

    const reviewsForDesigner = await request(app.getHttpServer())
      .get(`/designers/${designerId}/reviews`)
      .expect(200);
    expect(reviewsForDesigner.body.data.summary.count).toBe(1);
    expect(reviewsForDesigner.body.data.summary.averageRating).toBe(5);

    // 9. Duplicate review rejected
    await request(app.getHttpServer())
      .post(`/projects/${projectId}/reviews`)
      .set(authHeader(clientToken))
      .send({ rating: 4 })
      .expect(409);

    // 10. Notifications populated for designer
    const notifications = await request(app.getHttpServer())
      .get('/notifications')
      .set(authHeader(designerToken))
      .expect(200);
    expect(notifications.body.data.items.length).toBeGreaterThan(0);

    // 11. Reports create + list mine
    const reported = await request(app.getHttpServer())
      .post('/reports')
      .set(authHeader(clientToken))
      .send({
        targetType: 'USER',
        targetId: otherId,
        reportedUserId: otherId,
        reason: 'Inappropriate behaviour',
      })
      .expect(201);
    expect(reported.body.data.report.status).toBe('OPEN');

    await request(app.getHttpServer())
      .post('/reports')
      .set(authHeader(clientToken))
      .send({
        targetType: 'USER',
        targetId: clientId,
        reason: 'self',
      })
      .expect(400);

    const myReports = await request(app.getHttpServer())
      .get('/reports/mine')
      .set(authHeader(clientToken))
      .expect(200);
    expect(
      myReports.body.data.items.some(
        (r: { id: string }) => r.id === reported.body.data.report.id,
      ),
    ).toBe(true);

    // 12. AuthZ: unauthenticated protected route
    await request(app.getHttpServer()).get('/projects').expect(401);

    // 13. Blocks unique constraint
    await request(app.getHttpServer())
      .post('/blocks')
      .set(authHeader(clientToken))
      .send({ blockedId: otherId })
      .expect(201);
    await request(app.getHttpServer())
      .post('/blocks')
      .set(authHeader(clientToken))
      .send({ blockedId: otherId })
      .expect(409);
    await request(app.getHttpServer())
      .delete(`/blocks/${otherId}`)
      .set(authHeader(clientToken))
      .expect(200);
  });

  it('admin can suspend a user and approve a verification', async () => {
    // Designer submits verification
    const submitted = await request(app.getHttpServer())
      .post('/verifications')
      .set(authHeader(designerToken))
      .send({ evidenceUrl: 'https://cdn.test/id.pdf' })
      .expect(201);
    const verificationId: string = submitted.body.data.verification.id;

    // Admin sees it in pending queue
    const pending = await request(app.getHttpServer())
      .get('/verifications/admin/pending')
      .set(authHeader(adminToken))
      .expect(200);
    expect(
      pending.body.data.items.some(
        (v: { id: string }) => v.id === verificationId,
      ),
    ).toBe(true);

    // Approve
    const approved = await request(app.getHttpServer())
      .patch(`/verifications/${verificationId}/approve`)
      .set(authHeader(adminToken))
      .expect(200);
    expect(approved.body.data.verification.status).toBe(
      VerificationStatus.APPROVED,
    );

    // Designer should now be verified
    const designer = await prisma.user.findUniqueOrThrow({
      where: { id: designerId },
    });
    expect(designer.isVerified).toBe(true);

    // Admin suspends `other` user
    await request(app.getHttpServer())
      .patch(`/admin/users/${otherId}/suspend`)
      .set(authHeader(adminToken))
      .expect(200);
    const suspended = await prisma.user.findUniqueOrThrow({
      where: { id: otherId },
    });
    expect(suspended.status).toBe(AccountStatus.SUSPENDED);

    // Suspended user login fails
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: otherEmail, password })
      .expect(401);

    // Reactivate
    await request(app.getHttpServer())
      .patch(`/admin/users/${otherId}/reactivate`)
      .set(authHeader(adminToken))
      .expect(200);

    // Non-admin cannot access admin routes
    await request(app.getHttpServer())
      .get('/admin/users')
      .set(authHeader(clientToken))
      .expect(403);

    // Admin report queue + resolve
    const filed = await request(app.getHttpServer())
      .post('/reports')
      .set(authHeader(clientToken))
      .send({
        targetType: 'USER',
        targetId: otherId,
        reportedUserId: otherId,
        reason: 'Admin queue test',
      })
      .expect(201);
    const reportId: string = filed.body.data.report.id;

    const openReports = await request(app.getHttpServer())
      .get('/admin/reports')
      .set(authHeader(adminToken))
      .expect(200);
    expect(
      openReports.body.data.items.some(
        (r: { id: string }) => r.id === reportId,
      ),
    ).toBe(true);

    await request(app.getHttpServer())
      .patch(`/admin/reports/${reportId}/resolve`)
      .set(authHeader(adminToken))
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/admin/reports/${reportId}/dismiss`)
      .set(authHeader(clientToken))
      .expect(403);
  });
});
