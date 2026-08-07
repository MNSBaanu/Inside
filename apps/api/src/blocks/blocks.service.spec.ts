import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@inside/database';
import type { AuthUser } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { BlocksService } from './blocks.service';

describe('BlocksService', () => {
  const prisma = {
    user: { findUnique: jest.fn() },
    block: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  const client = {
    id: 'c1',
    role: Role.CLIENT,
    activeRole: Role.CLIENT,
  } as AuthUser;

  let service: BlocksService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BlocksService(prisma as unknown as PrismaService);
  });

  it('creates a block', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'd1' });
    prisma.block.create.mockResolvedValue({
      id: 'b1',
      blockerId: 'c1',
      blockedId: 'd1',
      reason: null,
      createdAt: new Date(),
      blocked: { id: 'd1', name: 'Des', avatarUrl: null },
    });

    const result = await service.create(client, { blockedId: 'd1' });
    expect(result.data.block.blockedId).toBe('d1');
  });

  it('rejects blocking yourself', async () => {
    await expect(
      service.create(client, { blockedId: 'c1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('404 when blocked user missing', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.create(client, { blockedId: 'missing' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('maps duplicate block to ConflictException', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'd1' });
    prisma.block.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    await expect(
      service.create(client, { blockedId: 'd1' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('remove 404 when block missing', async () => {
    prisma.block.findUnique.mockResolvedValue(null);
    await expect(service.remove(client, 'd1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('assertNotBlocked throws when either side blocked', async () => {
    prisma.block.findFirst.mockResolvedValue({ id: 'b1' });
    await expect(service.assertNotBlocked('c1', 'd1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('listBlockedCounterpartIds returns the other party ids', async () => {
    prisma.block.findMany.mockResolvedValue([
      { blockerId: 'c1', blockedId: 'd1' },
      { blockerId: 'd2', blockedId: 'c1' },
    ]);
    const ids = await service.listBlockedCounterpartIds('c1');
    expect([...ids].sort()).toEqual(['d1', 'd2']);
  });
});
