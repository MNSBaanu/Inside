import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { BlocksService } from '../../trust/blocks/blocks.service';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { PrismaService } from '../../../database/prisma.service';
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
  const blocks = { assertNotBlocked: jest.fn() };

  const client = {
    id: 'c1',
    name: 'Client',
    role: Role.CLIENT,
    activeRole: Role.CLIENT,
  } as AuthUser;

  const stranger = {
    id: 'x1',
    name: 'X',
    role: Role.CLIENT,
  } as AuthUser;

  let service: MessagesService;

  beforeEach(() => {
    jest.clearAllMocks();
    blocks.assertNotBlocked.mockResolvedValue(undefined);
    service = new MessagesService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
      blocks as unknown as BlocksService,
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
    expect(blocks.assertNotBlocked).toHaveBeenCalledWith('c1', 'd1');
    expect(notifications.notify).toHaveBeenCalled();
  });

  it('rejects send when users are blocked', async () => {
    prisma.project.findUnique.mockResolvedValue({
      id: 'p1',
      clientId: 'c1',
      designerId: 'd1',
      title: 'Sofa',
    });
    blocks.assertNotBlocked.mockRejectedValue(
      new ForbiddenException('You cannot interact with this user'),
    );

    await expect(
      service.send(client, 'p1', { content: 'hi' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.message.create).not.toHaveBeenCalled();
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

  it('rejects markRead for non-receiver', async () => {
    prisma.message.findUnique.mockResolvedValue({
      id: 'm1',
      receiverId: 'd1',
      isRead: false,
    });

    await expect(service.markRead(client, 'm1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('404 when message missing on markRead', async () => {
    prisma.message.findUnique.mockResolvedValue(null);
    await expect(service.markRead(client, 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
