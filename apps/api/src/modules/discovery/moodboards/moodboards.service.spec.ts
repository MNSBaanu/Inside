import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MoodboardStatus, Role } from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { MoodboardsService } from './moodboards.service';

describe('MoodboardsService', () => {
  const prisma = {
    moodboard: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findUniqueOrThrow: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
    product: { findFirst: jest.fn() },
  };
  const notifications = { notify: jest.fn() };

  const user = {
    id: 'c1',
    role: Role.CLIENT,
    activeRole: Role.CLIENT,
  } as AuthUser;

  let service: MoodboardsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MoodboardsService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
    );
  });

  it('saves edits to an approved moodboard as a new version', async () => {
    prisma.moodboard.findUnique.mockResolvedValue({
      id: 'm1',
      clientId: 'c1',
      name: 'Board',
      savedItems: [],
      moodWords: [],
      palette: [],
      status: MoodboardStatus.APPROVED,
      parentId: null,
      version: 1,
    });
    prisma.moodboard.aggregate.mockResolvedValue({ _max: { version: 2 } });
    prisma.moodboard.create.mockResolvedValue({ id: 'm3', clientId: 'c1' });
    prisma.moodboard.update.mockResolvedValue({
      id: 'm3',
      clientId: 'c1',
      name: 'Board, warmer',
      savedItems: [],
      moodWords: [],
      palette: [],
      status: MoodboardStatus.OPEN,
      parentId: 'm1',
      version: 3,
    });

    const result = await service.update(user, 'm1', { name: 'Board, warmer' });

    expect(prisma.moodboard.create.mock.calls[0][0].data).toMatchObject({
      parentId: 'm1',
      version: 3,
    });
    expect(prisma.moodboard.update.mock.calls[0][0].where).toEqual({
      id: 'm3',
    });
    expect(result.data.moodboard.version).toBe(3);
  });

  it('blocks adding a file that is already on the board', async () => {
    const fileHash = 'a'.repeat(64);
    prisma.moodboard.findUnique.mockResolvedValue({
      id: 'm1',
      clientId: 'c1',
      status: MoodboardStatus.OPEN,
      savedItems: [
        { imageUrl: 'https://res.cloudinary.com/x/a.jpg', fileHash },
      ],
    });

    await expect(
      service.addItem(user, 'm1', {
        imageUrl: 'https://res.cloudinary.com/x/b.jpg',
        fileHash,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      service.update(user, 'm1', {
        savedItems: [
          { imageUrl: 'https://res.cloudinary.com/x/a.jpg', fileHash },
          { imageUrl: 'https://res.cloudinary.com/x/c.jpg', fileHash },
        ],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.moodboard.updateMany).not.toHaveBeenCalled();
    expect(prisma.moodboard.update).not.toHaveBeenCalled();
  });

  it('will not delete an approved moodboard', async () => {
    prisma.moodboard.findUnique.mockResolvedValue({
      id: 'm1',
      clientId: 'c1',
      status: MoodboardStatus.APPROVED,
    });

    await expect(service.remove(user, 'm1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.moodboard.delete).not.toHaveBeenCalled();
  });

  it('adds an item to savedItems', async () => {
    prisma.moodboard.findUnique.mockResolvedValue({
      id: 'm1',
      clientId: 'c1',
      name: 'Board',
      savedItems: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.moodboard.findUniqueOrThrow.mockResolvedValue({
      id: 'm1',
      clientId: 'c1',
      name: 'Board',
      savedItems: [{ imageUrl: 'https://example.com/a.jpg', note: 'Warm' }],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.addItem(user, 'm1', {
      imageUrl: 'https://example.com/a.jpg',
      note: 'Warm',
    });

    expect(result.data.moodboard.savedItems).toHaveLength(1);
  });

  it('saves a shop product with details from the database', async () => {
    prisma.moodboard.findUnique.mockResolvedValue({
      id: 'm1',
      clientId: 'c1',
      name: 'Board',
      savedItems: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.product.findFirst.mockResolvedValue({
      slug: 'brass-floor-lamp',
      name: 'Brass Floor Lamp',
      price: 34500,
      imageUrl: 'https://images.unsplash.com/lamp.jpg',
    });
    prisma.moodboard.findUniqueOrThrow.mockResolvedValue({
      id: 'm1',
      clientId: 'c1',
      name: 'Board',
      savedItems: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await service.addItem(user, 'm1', {
      imageUrl: 'https://example.com/ignored.jpg',
      productSlug: 'brass-floor-lamp',
      productPrice: 1,
    });

    expect(prisma.moodboard.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          savedItems: [
            {
              imageUrl: 'https://images.unsplash.com/lamp.jpg',
              note: 'Brass Floor Lamp',
              productSlug: 'brass-floor-lamp',
              productPrice: 34500,
            },
          ],
        },
      }),
    );
  });

  it('forbids access to another client moodboard', async () => {
    prisma.moodboard.findUnique.mockResolvedValue({
      id: 'm1',
      clientId: 'other',
      savedItems: [],
    });

    await expect(service.getById(user, 'm1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('throws when removing invalid item index', async () => {
    prisma.moodboard.findUnique.mockResolvedValue({
      id: 'm1',
      clientId: 'c1',
      savedItems: [{ imageUrl: 'https://example.com/a.jpg' }],
    });

    await expect(service.removeItem(user, 'm1', 3)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
