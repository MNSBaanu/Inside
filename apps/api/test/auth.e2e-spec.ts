import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = Date.now();
  const email = `auth-e2e-${suffix}@insidesign.me`;
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
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.session.deleteMany({ where: { userId: user.id } });
      await prisma.authToken.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    await app.close();
  });

  it('registers, verifies email, and fetches /auth/me', async () => {
    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, name: 'E2E User', role: 'CLIENT' })
      .expect(201);

    expect(register.body.success).toBe(true);
    expect(register.body.data.accessToken).toBeDefined();
    expect(register.body.data.emailVerificationToken).toBeDefined();

    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: register.body.data.emailVerificationToken })
      .expect(201);

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${register.body.data.accessToken}`)
      .expect(200);

    expect(me.body.data.user.email).toBe(email);
    expect(me.body.data.user.emailVerified).toBe(true);
  });

  it('logs in and refreshes tokens', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    expect(login.body.data.refreshToken).toBeDefined();

    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.data.refreshToken })
      .expect(201);

    expect(refreshed.body.data.accessToken).toBeDefined();

    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: refreshed.body.data.refreshToken })
      .expect(201);
  });

  it('rejects invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'DefinitelyWrong1!' })
      .expect(401);
  });

  it('forgot-password and reset-password round trip', async () => {
    const forgot = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email })
      .expect(201);

    expect(forgot.body.success).toBe(true);
    expect(forgot.body.data.resetToken).toBeDefined();

    const newPassword = 'NewPassword123!';
    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({
        token: forgot.body.data.resetToken,
        newPassword,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: newPassword })
      .expect(201);
  });
});
