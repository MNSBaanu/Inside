import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('PortfoliosController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = Date.now();
  const email = `portfolio-e2e-${suffix}@inside.test`;
  const password = 'Password123!';
  let accessToken = '';
  let portfolioId = '';

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

    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
        name: 'Portfolio Designer',
        role: 'DESIGNER',
      })
      .expect(201);
    accessToken = register.body.data.accessToken;
  });

  afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.portfolio.deleteMany({ where: { designerId: user.id } });
      await prisma.session.deleteMany({ where: { userId: user.id } });
      await prisma.authToken.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    await app.close();
  });

  it('creates, lists, filters, and deletes a portfolio', async () => {
    const created = await request(app.getHttpServer())
      .post('/portfolios')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'E2E Coastal Bedroom',
        style: 'Coastal',
        roomType: 'Bedroom',
        budget: 320000,
        images: [
          {
            imageUrl: 'https://picsum.photos/seed/e2e-bed/800/600',
            caption: 'Main',
          },
        ],
      })
      .expect(201);

    portfolioId = created.body.data.portfolio.id;
    expect(created.body.data.portfolio.images).toHaveLength(1);

    const list = await request(app.getHttpServer())
      .get('/portfolios')
      .query({ style: 'Coastal', roomType: 'Bedroom' })
      .expect(200);

    expect(
      list.body.data.items.some(
        (item: { id: string }) => item.id === portfolioId,
      ),
    ).toBe(true);

    await request(app.getHttpServer())
      .get(`/portfolios/${portfolioId}`)
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/portfolios/${portfolioId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('rejects portfolio create for clients', async () => {
    const clientEmail = `portfolio-client-${suffix}@inside.test`;
    const client = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: clientEmail,
        password,
        name: 'Not Designer',
        role: 'CLIENT',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/portfolios')
      .set('Authorization', `Bearer ${client.body.data.accessToken}`)
      .send({
        title: 'Should Fail',
        style: 'Minimalist',
        roomType: 'Kitchen',
      })
      .expect(403);

    const user = await prisma.user.findUnique({
      where: { email: clientEmail },
    });
    if (user) {
      await prisma.session.deleteMany({ where: { userId: user.id } });
      await prisma.authToken.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
});
