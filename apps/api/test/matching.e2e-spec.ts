import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/filters/api-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Matching (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = Date.now();
  const clientEmail = `match-client-${suffix}@inside.test`;
  const designerEmail = `match-designer-${suffix}@inside.test`;
  const password = 'Password123!';
  let clientToken = '';
  let clientId = '';
  let designerId = '';
  let briefId = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
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
        name: 'Match Client',
        role: 'CLIENT',
      })
      .expect(201);
    clientToken = clientReg.body.data.accessToken;
    clientId = clientReg.body.data.user.id;

    const designerReg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: designerEmail,
        password,
        name: 'Match Designer',
        role: 'DESIGNER',
      })
      .expect(201);
    designerId = designerReg.body.data.user.id;
    const designerToken = designerReg.body.data.accessToken as string;

    await request(app.getHttpServer())
      .post('/portfolios')
      .set('Authorization', `Bearer ${designerToken}`)
      .send({
        title: 'Scandi Living',
        style: 'Scandinavian',
        roomType: 'Living Room',
        budget: 450000,
        isPublished: true,
      })
      .expect(201);

    const brief = await request(app.getHttpServer())
      .post('/briefs')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        styles: ['Scandinavian'],
        rooms: ['Living Room'],
        budgetRange: '400000-500000',
      })
      .expect(201);
    briefId = brief.body.data.brief.id;
  });

  afterAll(async () => {
    if (clientId) {
      await prisma.brief.deleteMany({ where: { clientId } });
      await prisma.block.deleteMany({
        where: { OR: [{ blockerId: clientId }, { blockedId: clientId }] },
      });
      await prisma.session.deleteMany({ where: { userId: clientId } });
      await prisma.authToken.deleteMany({ where: { userId: clientId } });
      await prisma.user.delete({ where: { id: clientId } }).catch(() => undefined);
    }
    if (designerId) {
      await prisma.portfolio.deleteMany({ where: { designerId } });
      await prisma.session.deleteMany({ where: { userId: designerId } });
      await prisma.authToken.deleteMany({ where: { userId: designerId } });
      await prisma.user
        .delete({ where: { id: designerId } })
        .catch(() => undefined);
    }
    await app.close();
  });

  it('ranks designers for a brief', async () => {
    const res = await request(app.getHttpServer())
      .get('/match/designers')
      .query({ briefId })
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.briefId).toBe(briefId);
    expect(res.body.data.items.length).toBeGreaterThan(0);
    expect(res.body.data.items[0].designer.id).toBe(designerId);
  });

  it('omits blocked designers from match results', async () => {
    await request(app.getHttpServer())
      .post('/blocks')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ blockedId: designerId })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/match/designers')
      .query({ briefId })
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);

    const ids = (res.body.data.items as { designer: { id: string } }[]).map(
      (i) => i.designer.id,
    );
    expect(ids).not.toContain(designerId);
  });

  it('returns error envelope for missing brief', async () => {
    const res = await request(app.getHttpServer())
      .get('/match/designers')
      .query({ briefId: '00000000-0000-4000-8000-000000000099' })
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(404);

    expect(res.body).toEqual({
      success: false,
      error: {
        statusCode: 404,
        message: 'Brief not found',
      },
    });
  });
});
