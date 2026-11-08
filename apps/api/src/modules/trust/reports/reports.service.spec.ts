import { BadRequestException } from '@nestjs/common';
import { ReportStatus, ReportTargetType, Role } from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { PrismaService } from '../../../database/prisma.service';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  const prisma = {
    report: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    user: { count: jest.fn().mockResolvedValue(1) },
    project: { count: jest.fn().mockResolvedValue(1) },
    portfolio: { count: jest.fn().mockResolvedValue(1) },
    review: { count: jest.fn().mockResolvedValue(1) },
    message: { count: jest.fn().mockResolvedValue(1) },
  };

  const client = {
    id: 'c1',
    role: Role.CLIENT,
    activeRole: Role.CLIENT,
  } as AuthUser;

  let service: ReportsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReportsService(prisma as unknown as PrismaService);
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
      reportedUserId: 'd1',
      reason: 'spam',
    });

    expect(result.data.report.id).toBe('r1');
    expect(result.data.report.status).toBe(ReportStatus.OPEN);
    expect(prisma.report.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reporterId: 'c1',
          targetId: 'd1',
        }),
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

  it('lists own reports only', async () => {
    prisma.report.findMany.mockResolvedValue([]);
    await service.listMine(client);
    expect(prisma.report.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { reporterId: 'c1' } }),
    );
  });
});
