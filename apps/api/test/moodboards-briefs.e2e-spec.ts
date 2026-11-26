import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Moodboards & Briefs (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = Date.now();
  const email = `mood-brief-${suffix}@insidesign.me`;
  const password = 'Password123!';
  let token = '';
  let moodboardId = '';

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
        name: 'Mood Client',
        role: 'CLIENT',
      })
      .expect(201);
    token = register.body.data.accessToken;
  });

  afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.brief.deleteMany({ where: { clientId: user.id } });
      await prisma.moodboard.deleteMany({ where: { clientId: user.id } });
      await prisma.session.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    await app.close();
  });

  it('saves a shop product with an external photo, but not a stray external image', async () => {
    const product = await prisma.product.create({
      data: {
        slug: `e2e-bedside-${suffix}`,
        name: 'Teak bedside table',
        description: 'A bedside table in teak.',
        category: 'Furniture',
        price: 27500,
        imageUrl: 'https://images.unsplash.com/photo-e2e',
        sellerName: 'Heritage Woodworks',
        sellerUrl: 'https://example.com',
      },
    });
    try {
      const board = await request(app.getHttpServer())
        .post('/moodboards')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Bedroom Calm' })
        .expect(201);
      const id = board.body.data.moodboard.id;

      const saved = await request(app.getHttpServer())
        .post(`/moodboards/${id}/items`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          imageUrl: product.imageUrl,
          note: product.name,
          productSlug: product.slug,
        })
        .expect(201);
      expect(saved.body.data.moodboard.savedItems).toEqual([
        expect.objectContaining({
          imageUrl: product.imageUrl,
          productSlug: product.slug,
          productPrice: 27500,
        }),
      ]);

      await request(app.getHttpServer())
        .post(`/moodboards/${id}/items`)
        .set('Authorization', `Bearer ${token}`)
        .send({ imageUrl: 'https://images.unsplash.com/photo-stray' })
        .expect(400);
    } finally {
      await prisma.product.delete({ where: { id: product.id } });
    }
  });

  it('creates moodboard, adds item, generates and updates brief', async () => {
    const board = await request(app.getHttpServer())
      .post('/moodboards')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Coastal Ideas' })
      .expect(201);

    moodboardId = board.body.data.moodboard.id;

    await request(app.getHttpServer())
      .post(`/moodboards/${moodboardId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        imageUrl: 'https://res.cloudinary.com/e2e/seed/mood-e2e/800/600',
        note: 'Soft blues',
      })
      .expect(201);

    const generated = await request(app.getHttpServer())
      .post('/briefs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        moodboardId,
        styles: ['Coastal'],
        rooms: ['Bedroom'],
        budgetRange: '250000-400000',
      })
      .expect(201);

    expect(generated.body.data.brief.moodboardId).toBe(moodboardId);
    expect(generated.body.data.brief.moodboard.images).toHaveLength(1);

    const briefId = generated.body.data.brief.id as string;

    await request(app.getHttpServer())
      .patch(`/briefs/${briefId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Edited brief' })
      .expect(200);

    await request(app.getHttpServer())
      .get('/briefs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.items.length).toBeGreaterThan(0);
      });
  });
});
