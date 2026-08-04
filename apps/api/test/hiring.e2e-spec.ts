import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { StageName } from '@inside/database';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Hiring flow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = Date.now();
  const clientEmail = `hire-client-${suffix}@inside.test`;
  const designerEmail = `hire-designer-${suffix}@inside.test`;
  const password = 'Password123!';
  let clientToken = '';
  let designerToken = '';
  let requestId = '';
  let proposalId = '';

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

    const clientReg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: clientEmail,
        password,
        name: 'Hire Client',
        role: 'CLIENT',
      })
      .expect(201);
    clientToken = clientReg.body.data.accessToken;

    const designerReg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: designerEmail,
        password,
        name: 'Hire Designer',
        role: 'DESIGNER',
      })
      .expect(201);
    designerToken = designerReg.body.data.accessToken;
  });

  afterAll(async () => {
    for (const email of [clientEmail, designerEmail]) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        const projects = await prisma.project.findMany({
          where: {
            OR: [{ clientId: user.id }, { designerId: user.id }],
          },
        });
        for (const project of projects) {
          await prisma.projectStage.deleteMany({
            where: { projectId: project.id },
          });
          await prisma.project.delete({ where: { id: project.id } });
        }
        await prisma.proposal.deleteMany({
          where: {
            OR: [{ designerId: user.id }],
          },
        });
        await prisma.projectRequest.deleteMany({
          where: {
            OR: [{ clientId: user.id }, { designerId: user.id }],
          },
        });
        await prisma.session.deleteMany({ where: { userId: user.id } });
        await prisma.authToken.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    }
    await app.close();
  });

  it('client creates open request, designer proposes, client accepts → project with 5 stages', async () => {
    const created = await request(app.getHttpServer())
      .post('/requests')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        title: 'Modern living room',
        description: 'Need a cozy modern look',
        type: 'OPEN',
        budget: 800000,
      })
      .expect(201);

    expect(created.body.data.request.status).toBe('OPEN');
    requestId = created.body.data.request.id;

    const stageFees = [
      { name: StageName.PROPOSAL, fee: 50000 },
      { name: StageName.CONCEPT, fee: 100000 },
      { name: StageName.DESIGN, fee: 200000 },
      { name: StageName.REVISION, fee: 75000 },
      { name: StageName.COMPLETION, fee: 125000 },
    ];

    const proposal = await request(app.getHttpServer())
      .post(`/requests/${requestId}/proposals`)
      .set('Authorization', `Bearer ${designerToken}`)
      .send({
        scope: 'Full interior design package',
        timeline: '10 weeks',
        stageFees,
      })
      .expect(201);

    expect(proposal.body.data.proposal.totalAmount).toBe(550000);
    proposalId = proposal.body.data.proposal.id;

    const list = await request(app.getHttpServer())
      .get(`/requests/${requestId}/proposals`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);

    expect(list.body.data.items).toHaveLength(1);

    const accepted = await request(app.getHttpServer())
      .patch(`/proposals/${proposalId}/accept`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);

    expect(accepted.body.data.project.stages).toHaveLength(5);
    expect(accepted.body.data.project.title).toBe('Modern living room');
    expect(accepted.body.data.project.stages[0].name).toBe(StageName.PROPOSAL);
    expect(accepted.body.data.project.stages[4].name).toBe(
      StageName.COMPLETION,
    );

    const dbProject = await prisma.project.findUnique({
      where: { proposalId },
      include: { stages: { orderBy: { stageOrder: 'asc' } } },
    });
    expect(dbProject).not.toBeNull();
    expect(dbProject!.stages).toHaveLength(5);

    const dbRequest = await prisma.projectRequest.findUnique({
      where: { id: requestId },
    });
    expect(dbRequest!.status).toBe('ACCEPTED');
  });
});
