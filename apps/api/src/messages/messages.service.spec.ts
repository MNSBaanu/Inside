import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@inside/database';
import type { AuthUser } from '../auth/auth.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesService } from './messages.service';

describe('MessagesService', () => {
  const prisma = {
    project: { findUnique: jest.fn() },
    message: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const notifications = { notify: jest.fn() };

  const client = {
    id: 'c1',
    name: 'Client',
    role: Role.CLIENT,
    activeRole: Role.CLIENT,
  } as AuthUser;

  const designer = {
    id: 'd1',
    name: 'Designer',
    role: Role.DESIGNER,
    activeRole: Role.DESIGNER,
  } as AuthUser;

  const stranger = {
    id: 'x1',
    name: 'X',
    role: Role.CLIENT,
  } as AuthUser;

  let service: MessagesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MessagesService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
    );
  });

  it('sends message from client to designer', async () => {
    prisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      clientId: 'c1',
      designerId: 'd1',
      title: 'Sofa',
    });
    prisma.message.create.mockResolvedValue({
      id: 'm1',
      projectId: 'p1',
      senderId: 'c1',
      receiverId: 'd1',
      content: 'hi',
      attachmentUrl: null,
      attachmentType: null,
      isRead: false,
      readAt: null,
      sentAt: new Date(),
    });

    const result = await service.send(client, 'p1', { content: 'hi' });
    expect(result.data.message.receiverId).toBe('d1');
    expect(notifications.notify).toHaveBeenCalled();
  });

  it('rejects non-party from sending', async () => {
    prisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      clientId: 'c1',
      designerId: 'd1',
      title: 'Sofa',
    });
    await expect(
      service.send(stranger, 'p1', { content: 'hi' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('markRead requires receiver', async () => {
    prisma.message.findUnique.mockResolvedValue({
      id: 'm1',
      receiverId: 'c1',
      isRead: false,
    });
    await expect(service.markRead(designer, 'm1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('list rejects with 404 for missing project', async () => {
    prisma.project.findUnique.mockResolvedValue(null);
    await expect(service.list(client, 'p1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
