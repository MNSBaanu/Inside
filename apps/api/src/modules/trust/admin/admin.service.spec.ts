import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  AccountStatus,
  ReportStatus,
  ReportTargetType,
  Role,
} from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { ActivityService } from '../../platform/activity/activity.service';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { PrismaService } from '../../../database/prisma.service';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  const tx = {
    user: { update: jest.fn() },
    session: { updateMany: jest.fn() },
  };

  const prisma = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    session: { updateMany: jest.fn() },
    report: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    portfolio: { updateMany: jest.fn() },
    $transaction: jest.fn(async (fn: (t: typeof tx) => Promise<unknown>) =>
      fn(tx),
    ),
  };

  const notifications = { notify: jest.fn() };
  const activity = { log: jest.fn() };

  const admin = { id: 'a1', role: Role.ADMIN } as AuthUser;

  let service: AdminService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
      activity as unknown as ActivityService,
    );
  });

  it('suspend forbids self-suspension', async () => {
    await expect(service.suspend(admin, admin.id)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('suspend 404 when user missing', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.suspend(admin, 'u1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('suspend updates status and revokes sessions', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      status: AccountStatus.ACTIVE,
    });
    tx.user.update.mockResolvedValue({
      id: 'u1',
      status: AccountStatus.SUSPENDED,
    });

    const result = await service.suspend(admin, 'u1');
    expect(result.data.user.status).toBe(AccountStatus.SUSPENDED);
    expect(tx.session.updateMany).toHaveBeenCalled();
  });

  it('resolveReport sets status RESOLVED with admin', async () => {
    prisma.report.findUnique.mockResolvedValue({
      id: 'r1',
      reporterId: 'u2',
      status: ReportStatus.OPEN,
    });
    prisma.report.update.mockResolvedValue({
      id: 'r1',
      reporterId: 'u2',
      reportedUserId: null,
      targetType: ReportTargetType.USER,
      targetId: 'u3',
      reason: 'spam',
      details: null,
      status: ReportStatus.RESOLVED,
      resolvedById: 'a1',
      resolvedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const result = await service.resolveReport(admin, 'r1');
    expect(result.data.report.status).toBe(ReportStatus.RESOLVED);
    expect(result.data.report.resolvedById).toBe('a1');
  });

  it('resolveReport can unpublish a reported portfolio and keep a note', async () => {
    prisma.report.findUnique.mockResolvedValue({
      id: 'r2',
      reporterId: 'u2',
      targetType: ReportTargetType.PORTFOLIO,
      targetId: 'p1',
      status: ReportStatus.OPEN,
    });
    prisma.report.update.mockImplementation(({ data }) => ({
      id: 'r2',
      reporterId: 'u2',
      reportedUserId: null,
      targetType: ReportTargetType.PORTFOLIO,
      targetId: 'p1',
      reason: 'copied',
      details: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    }));
    const result = await service.resolveReport(admin, 'r2', {
      note: 'Copied images',
      removeContent: true,
    });
    expect(prisma.portfolio.updateMany).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { isPublished: false },
    });
    expect(result.data.report.resolution).toBe('Copied images');
  });
});
