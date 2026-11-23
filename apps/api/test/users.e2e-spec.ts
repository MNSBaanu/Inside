import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('UsersController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = Date.now();
  const designerEmail = `designer-users-${suffix}@insidesign.me`;
  const clientEmail = `client-users-${suffix}@insidesign.me`;
  const password = 'Password123!';

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
  });

  afterAll(async () => {
    for (const email of [designerEmail, clientEmail]) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await prisma.session.deleteMany({ where: { userId: user.id } });
        await prisma.authToken.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    }
    await app.close();
  });

  it('updates profile and switches designer activeRole', async () => {
    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: designerEmail,
        password,
        name: 'Switch Designer',
        role: 'DESIGNER',
      })
      .expect(201);

    const token = register.body.data.accessToken as string;

    const profile = await request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ bio: 'Scandi interiors', location: 'Kandy' })
      .expect(200);

    expect(profile.body.data.user.bio).toBe('Scandi interiors');
    expect(profile.body.data.user.hasClientAccount).toBe(false);

    await request(app.getHttpServer())
      .patch('/users/me/active-role')
      .set('Authorization', `Bearer ${token}`)
      .send({ activeRole: 'CLIENT' })
      .expect(403);

    const created = await request(app.getHttpServer())
      .post('/users/me/client-account')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(created.body.data.user.hasClientAccount).toBe(true);

    const switched = await request(app.getHttpServer())
      .patch('/users/me/active-role')
      .set('Authorization', `Bearer ${token}`)
      .send({ activeRole: 'CLIENT' })
      .expect(200);

    expect(switched.body.data.user.activeRole).toBe('CLIENT');
    expect(switched.body.data.accessToken).toBeDefined();

    const me = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${switched.body.data.accessToken}`)
      .expect(200);

    expect(me.body.data.user.activeRole).toBe('CLIENT');
  });

  it('forbids client switching to DESIGNER', async () => {
    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: clientEmail,
        password,
        name: 'Plain Client',
        role: 'CLIENT',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch('/users/me/active-role')
      .set('Authorization', `Bearer ${register.body.data.accessToken}`)
      .send({ activeRole: 'DESIGNER' })
      .expect(403);

    const upgraded = await request(app.getHttpServer())
      .post('/users/me/designer-account')
      .set('Authorization', `Bearer ${register.body.data.accessToken}`)
      .expect(201);

    expect(upgraded.body.data.user).toMatchObject({
      role: 'DESIGNER',
      activeRole: 'DESIGNER',
      hasClientAccount: true,
    });

    await request(app.getHttpServer())
      .patch('/users/me/active-role')
      .set('Authorization', `Bearer ${upgraded.body.data.accessToken}`)
      .send({ activeRole: 'CLIENT' })
      .expect(200);
  });
});
