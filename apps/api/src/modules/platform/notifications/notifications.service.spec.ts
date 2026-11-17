import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationType, Role } from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  const prisma = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    user: { findMany: jest.fn() },
  };

  const user = {
    id: 'u1',
    role: Role.CLIENT,
    activeRole: Role.CLIENT,
  } as AuthUser;

  let service: NotificationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationsService(prisma as unknown as PrismaService);
  });

  it('notify creates a notification', async () => {
    prisma.notification.create.mockResolvedValue({});
    await service.notify({
      userId: 'u1',
      type: NotificationType.PROJECT,
      title: 'Hello',
      message: 'World',
    });
    expect(prisma.notification.create).toHaveBeenCalled();
  });

  it('notifyAdmins notifies each active admin once', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 'a1' }, { id: 'a2' }]);
    prisma.notification.create.mockResolvedValue({});
    await service.notifyAdmins({
      type: NotificationType.SYSTEM,
      title: 'New report',
      message: 'Someone reported a user',
    });
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ role: Role.ADMIN }),
      }),
    );
    expect(prisma.notification.create).toHaveBeenCalledTimes(2);
  });

  it('notifyMany skips duplicate users', async () => {
    prisma.notification.create.mockResolvedValue({});
    await service.notifyMany(['d1', 'd1', 'd2'], {
      type: NotificationType.REQUEST,
      title: 'Request closed',
      message: 'Closed',
    });
    expect(prisma.notification.create).toHaveBeenCalledTimes(2);
  });

  it('notify swallows database errors', async () => {
    prisma.notification.create.mockRejectedValue(new Error('down'));
    await expect(
      service.notify({
        userId: 'u1',
        type: NotificationType.PROJECT,
        title: 'x',
        message: 'y',
      }),
    ).resolves.toBeUndefined();
  });

  it('markRead rejects other users', async () => {
    prisma.notification.findUnique.mockResolvedValue({
      id: 'n1',
      userId: 'other',
    });
    await expect(service.markRead(user, 'n1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('markRead 404 when missing', async () => {
    prisma.notification.findUnique.mockResolvedValue(null);
    await expect(service.markRead(user, 'n1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
