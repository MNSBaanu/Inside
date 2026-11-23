import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Role } from '@inside/database';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('FavouritesController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = Date.now();
  const clientEmail = `fav-client-${suffix}@insidesign.me`;
  const designerEmail = `fav-designer-${suffix}@insidesign.me`;
  const password = 'Password123!';
  let clientToken = '';
  let designerId = '';

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
        name: 'Fav Client',
        role: 'CLIENT',
      })
      .expect(201);
    clientToken = clientReg.body.data.accessToken;

    const designerReg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: designerEmail,
        password,
        name: 'Fav Designer',
        role: 'DESIGNER',
      })
      .expect(201);
    designerId = designerReg.body.data.user.id;
  });

  afterAll(async () => {
    for (const email of [clientEmail, designerEmail]) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await prisma.favourite.deleteMany({
          where: {
            OR: [{ clientId: user.id }, { designerId: user.id }],
          },
        });
        await prisma.session.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    }
    await app.close();
  });

  it('creates, lists, rejects duplicate, and deletes favourite', async () => {
    const created = await request(app.getHttpServer())
      .post('/favourites')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ designerId })
      .expect(201);

    expect(created.body.data.favourite.designerId).toBe(designerId);

    const list = await request(app.getHttpServer())
      .get('/favourites')
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);

    expect(
      list.body.data.items.some(
        (i: { designerId: string }) => i.designerId === designerId,
      ),
    ).toBe(true);

    await request(app.getHttpServer())
      .post('/favourites')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ designerId })
      .expect(409);

    await request(app.getHttpServer())
      .delete(`/favourites/${designerId}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);
  });

  it('rejects designer-mode users without client activeRole', async () => {
    const designer = await prisma.user.findUniqueOrThrow({
      where: { email: designerEmail },
    });
    expect(designer.role).toBe(Role.DESIGNER);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: designerEmail, password })
      .expect(201);

    await request(app.getHttpServer())
      .post('/favourites')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .send({ designerId })
      .expect(403);
  });
});
