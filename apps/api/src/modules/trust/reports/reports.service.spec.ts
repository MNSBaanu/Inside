import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ReportStatus, ReportTargetType, Role } from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  const prisma = {
    report: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: { findUnique: jest.fn() },
    project: { findUnique: jest.fn() },
    portfolio: { findUnique: jest.fn() },
    review: { findUnique: jest.fn() },
    message: { findUnique: jest.fn() },
  };

  const notifications = { notifyAdmins: jest.fn() };

  const client = {
    id: 'c1',
    name: 'Nadia',
    role: Role.CLIENT,
    activeRole: Role.CLIENT,
  } as AuthUser;

  let service: ReportsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.report.count.mockResolvedValue(0);
    prisma.user.findUnique.mockImplementation(
      ({ where }: { where: { id: string } }) => ({ id: where.id }),
    );
    service = new ReportsService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
    );
  });

  it('creates a report', async () => {
    const now = new Date();
    prisma.report.create.mockResolvedValue({
      id: 'r1',
      reporterId: 'c1',
      reportedUserId: 'd1',
      targetType: ReportTargetType.USER,
      targetId: 'd1',
      reason: 'spam',
      details: null,
      status: ReportStatus.OPEN,
      resolvedById: null,
      resolvedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    const result = await service.create(client, {
      targetType: ReportTargetType.USER,
      targetId: 'd1',
      reason: 'spam',
    });

    expect(result.data.report.id).toBe('r1');
    expect(result.data.report.status).toBe(ReportStatus.OPEN);
    expect(prisma.report.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reporterId: 'c1',
          reportedUserId: 'd1',
          targetId: 'd1',
        }),
      }),
    );
    expect(notifications.notifyAdmins).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'New report',
        metadata: { reportId: 'r1', href: '/admin/reports' },
      }),
    );
  });

  it('rejects reporting yourself', async () => {
    await expect(
      service.create(client, {
        targetType: ReportTargetType.USER,
        targetId: 'c1',
        reason: 'oops',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a second report while the first is still open', async () => {
    prisma.report.count.mockResolvedValue(1);
    await expect(
      service.create(client, {
        targetType: ReportTargetType.USER,
        targetId: 'd1',
        reason: 'spam again',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.report.create).not.toHaveBeenCalled();
  });

  it('reports a review against its author', async () => {
    prisma.review.findUnique.mockResolvedValue({ reviewerId: 'c9' });
    prisma.report.create.mockResolvedValue({ id: 'r2' });
    await service.create(client, {
      targetType: ReportTargetType.REVIEW,
      targetId: 'rv1',
      reason: 'fake review',
    });
    expect(prisma.report.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ reportedUserId: 'c9' }),
      }),
    );
  });

  it('only lets people in the project report its messages', async () => {
    prisma.message.findUnique.mockResolvedValue({
      senderId: 'd1',
      project: { clientId: 'c2', designerId: 'd1' },
    });
    await expect(
      service.create(client, {
        targetType: ReportTargetType.MESSAGE,
        targetId: 'm1',
        reason: 'rude',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lists own reports only', async () => {
    prisma.report.findMany.mockResolvedValue([]);
    await service.listMine(client);
    expect(prisma.report.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { reporterId: 'c1' } }),
    );
  });
});
