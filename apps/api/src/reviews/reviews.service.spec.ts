import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProjectStatus, Role } from '@inside/database';
import type { AuthUser } from '../auth/auth.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  const prisma = {
    project: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    review: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  const notifications = { notify: jest.fn() };

  const client = {
    id: 'c1',
    role: Role.CLIENT,
    activeRole: Role.CLIENT,
  } as AuthUser;

  const designer = {
    id: 'd1',
    role: Role.DESIGNER,
    activeRole: Role.DESIGNER,
  } as AuthUser;

  const completed = {
    id: 'p1',
    clientId: 'c1',
    designerId: 'd1',
    status: ProjectStatus.COMPLETED,
    title: 'Sofa',
  };

  let service: ReviewsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReviewsService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
    );
  });

  it('client creates review on completed project', async () => {
    prisma.project.findUnique.mockResolvedValue(completed);
    prisma.review.create.mockResolvedValue({
      id: 'r1',
      projectId: 'p1',
      reviewerId: 'c1',
      designerId: 'd1',
      rating: 5,
      comment: 'great',
      isVisible: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      reviewer: { id: 'c1', name: 'Client', avatarUrl: null },
    });

    const result = await service.create(client, 'p1', {
      rating: 5,
      comment: 'great',
    });
    expect(result.data.review.rating).toBe(5);
  });

  it('rejects review by designer', async () => {
    prisma.project.findUnique.mockResolvedValue(completed);
    await expect(
      service.create(designer, 'p1', { rating: 5 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects review on active project', async () => {
    prisma.project.findUnique.mockResolvedValue({
      ...completed,
      status: ProjectStatus.ACTIVE,
    });
    await expect(
      service.create(client, 'p1', { rating: 4 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('maps duplicate review to ConflictException', async () => {
    prisma.project.findUnique.mockResolvedValue(completed);
    const err = new Prisma.PrismaClientKnownRequestError('Unique', {
      code: 'P2002',
      clientVersion: 'test',
    });
    prisma.review.create.mockRejectedValue(err);
    await expect(
      service.create(client, 'p1', { rating: 5 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('listByDesigner rejects non-designer id', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'x', role: Role.CLIENT });
    await expect(service.listByDesigner('x', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("findMine returns the caller's review, even before approval", async () => {
    prisma.review.findUnique.mockResolvedValue({
      id: 'r1',
      projectId: 'p1',
      reviewerId: 'c1',
      designerId: 'd1',
      rating: 4,
      comment: null,
      isVisible: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      reviewer: { id: 'c1', name: 'Client', avatarUrl: null },
    });

    const result = await service.findMine(client, 'p1');

    expect(prisma.review.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId_reviewerId: { projectId: 'p1', reviewerId: 'c1' } },
      }),
    );
    expect(result.data.review).toMatchObject({ rating: 4, isVisible: false });
  });

  it('findMine returns null when there is no review', async () => {
    prisma.review.findUnique.mockResolvedValue(null);
    const result = await service.findMine(client, 'p1');
    expect(result.data.review).toBeNull();
  });
});
