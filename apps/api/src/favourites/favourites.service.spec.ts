import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@inside/database';
import type { AuthUser } from '../auth/auth.service';
import { BlocksService } from '../blocks/blocks.service';
import { PrismaService } from '../prisma/prisma.service';
import { FavouritesService } from './favourites.service';

describe('FavouritesService', () => {
  const prisma = {
    user: { findUnique: jest.fn() },
    favourite: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  const blocks = { assertNotBlocked: jest.fn() };

  const client = {
    id: 'c1',
    role: Role.CLIENT,
    activeRole: Role.CLIENT,
  } as AuthUser;

  let service: FavouritesService;

  beforeEach(() => {
    jest.clearAllMocks();
    blocks.assertNotBlocked.mockResolvedValue(undefined);
    service = new FavouritesService(
      prisma as unknown as PrismaService,
      blocks as unknown as BlocksService,
    );
  });

  it('creates a favourite for a designer', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'd1',
      role: Role.DESIGNER,
    });
    prisma.favourite.create.mockResolvedValue({
      id: 'f1',
      clientId: 'c1',
      designerId: 'd1',
      createdAt: new Date(),
      designer: {
        id: 'd1',
        name: 'Ravi',
        avatarUrl: null,
        location: 'Kandy',
        bio: null,
        isVerified: true,
        isAvailable: true,
      },
    });

    const result = await service.create(client, { designerId: 'd1' });
    expect(result.data.favourite.designerId).toBe('d1');
    expect(blocks.assertNotBlocked).toHaveBeenCalledWith('c1', 'd1');
  });

  it('rejects favourite when blocked', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'd1',
      role: Role.DESIGNER,
    });
    blocks.assertNotBlocked.mockRejectedValue(
      new ForbiddenException('You cannot interact with this user'),
    );

    await expect(
      service.create(client, { designerId: 'd1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('maps duplicate favourite to ConflictException', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'd1',
      role: Role.DESIGNER,
    });
    const err = new Prisma.PrismaClientKnownRequestError('Unique', {
      code: 'P2002',
      clientVersion: 'test',
    });
    prisma.favourite.create.mockRejectedValue(err);

    await expect(
      service.create(client, { designerId: 'd1' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects favouriting a non-designer', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'c2',
      role: Role.CLIENT,
    });

    await expect(
      service.create(client, { designerId: 'c2' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
