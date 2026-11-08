import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@inside/database';
import { PortfoliosService } from './portfolios.service';
import { PrismaService } from '../../../database/prisma.service';
import type { AuthUser } from '../../identity/auth/auth.service';

describe('PortfoliosService', () => {
  const prisma = {
    portfolio: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    portfolioImage: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: PortfoliosService;
  const designer = {
    id: 'd1',
    role: Role.DESIGNER,
    activeRole: Role.DESIGNER,
  } as AuthUser;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PortfoliosService(prisma as unknown as PrismaService);
  });

  it('lists published portfolios with filters', async () => {
    prisma.$transaction.mockResolvedValue([
      1,
      [
        {
          id: 'p1',
          designerId: 'd1',
          title: 'Room',
          description: null,
          style: 'Scandinavian',
          roomType: 'Living Room',
          budget: 100,
          isPublished: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          designer: {
            id: 'd1',
            name: 'Ravi',
            avatarUrl: null,
            location: null,
            isVerified: true,
          },
          images: [],
        },
      ],
    ]);

    const result = await service.listPublic({ style: 'Scandinavian' });
    expect(result.data.total).toBe(1);
    expect(result.data.items[0].budget).toBe(100);
  });

  it('filters by keyword and designer location', async () => {
    prisma.$transaction.mockResolvedValue([0, []]);

    await service.listPublic({ q: 'oak', location: 'Kandy' });

    expect(prisma.portfolio.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          designer: expect.objectContaining({
            location: { contains: 'Kandy', mode: 'insensitive' },
          }),
          OR: expect.arrayContaining([
            { title: { contains: 'oak', mode: 'insensitive' } },
          ]),
        }),
      }),
    );
  });

  it('hides unpublished portfolios from non-owners', async () => {
    prisma.portfolio.findUnique.mockResolvedValue({
      id: 'p1',
      designerId: 'd1',
      isPublished: false,
      title: 'Draft',
      description: null,
      style: 'Minimalist',
      roomType: 'Kitchen',
      budget: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      designer: {
        id: 'd1',
        name: 'Ravi',
        avatarUrl: null,
        location: null,
        isVerified: true,
      },
      images: [],
    });

    await expect(service.getById('p1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('forbids updating another designer portfolio', async () => {
    prisma.portfolio.findUnique.mockResolvedValue({
      id: 'p1',
      designerId: 'other',
    });

    await expect(
      service.update(designer, 'p1', { title: 'Nope' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
