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
