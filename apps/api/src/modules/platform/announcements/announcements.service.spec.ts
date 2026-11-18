import { BadRequestException } from '@nestjs/common';
import { AccountStatus, Role } from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { PrismaService } from '../../../database/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { AnnouncementsService } from './announcements.service';

describe('AnnouncementsService', () => {
  const prisma = {
    announcement: { create: jest.fn(), findMany: jest.fn() },
    user: { findMany: jest.fn() },
    notification: { createMany: jest.fn() },
  };
  const activity = { log: jest.fn() };
  const admin = { id: 'a1', role: Role.ADMIN } as AuthUser;
  let service: AnnouncementsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AnnouncementsService(
      prisma as unknown as PrismaService,
      activity as unknown as ActivityService,
    );
  });

  it('notifies only active designers for a designer announcement', async () => {
    prisma.announcement.create.mockResolvedValue({
      id: 'n1',
      title: 'Portfolio tips',
      message: 'New guide for designers',
    });
    prisma.user.findMany.mockResolvedValue([{ id: 'd1' }, { id: 'd2' }]);

    const result = await service.create(admin, {
      title: 'Portfolio tips',
      message: 'New guide for designers',
      audience: 'DESIGNERS',
    });

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        status: AccountStatus.ACTIVE,
        id: { not: 'a1' },
        role: Role.DESIGNER,
      },
      select: { id: true },
    });
    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ userId: 'd1', title: 'Portfolio tips' }),
        expect.objectContaining({ userId: 'd2', title: 'Portfolio tips' }),
      ],
    });
    expect(result.data.recipients).toBe(2);
  });

  it('rejects an end time in the past', async () => {
    await expect(
      service.create(admin, {
        title: 'Old news',
        message: 'Already over',
        endsAt: new Date(Date.now() - 60_000).toISOString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.announcement.create).not.toHaveBeenCalled();
  });

  it('shows clients only announcements meant for them', async () => {
    prisma.announcement.findMany.mockResolvedValue([]);
    await service.active({
      id: 'c1',
      role: Role.CLIENT,
      hasClientAccount: false,
    } as AuthUser);
    expect(prisma.announcement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          audience: { in: ['ALL', 'CLIENTS'] },
        }) as unknown,
      }),
    );
  });
});
