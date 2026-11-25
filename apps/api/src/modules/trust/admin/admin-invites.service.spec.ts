import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountStatus, Role } from '@inside/database';
import { PrismaService } from '../../../database/prisma.service';
import type { AuthUser } from '../../identity/auth/auth.service';
import { ActivityService } from '../../platform/activity/activity.service';
import { EmailService } from '../../platform/email/email.service';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { AdminInvitesService } from './admin-invites.service';

describe('AdminInvitesService', () => {
  const tx = {
    user: { update: jest.fn() },
    session: { updateMany: jest.fn() },
    adminInvite: {
      updateMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const prisma = {
    user: { findUnique: jest.fn() },
    adminInvite: { findUnique: jest.fn() },
    $transaction: jest.fn(async (fn: (t: typeof tx) => Promise<unknown>) =>
      fn(tx),
    ),
  };
  const config = { get: jest.fn() };
  const email = { send: jest.fn() };
  const activity = { log: jest.fn() };
  const notifications = { notify: jest.fn() };

  const owner = { id: 'o1', role: Role.ADMIN } as AuthUser;
  const invitee = { id: 'u1', role: Role.CLIENT } as AuthUser;
  let service: AdminInvitesService;

  beforeEach(() => {
    jest.clearAllMocks();
    config.get.mockReturnValue(undefined);
    service = new AdminInvitesService(
      prisma as unknown as PrismaService,
      config as unknown as ConfigService,
      email as unknown as EmailService,
      activity as unknown as ActivityService,
      notifications as unknown as NotificationsService,
    );
  });

  it('only the owner can invite', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ isOwner: false });
    await expect(service.create(owner, 'a@b.com')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(email.send).not.toHaveBeenCalled();
  });

  it('refuses to invite someone who is already an admin', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ isOwner: true })
      .mockResolvedValueOnce({ role: Role.ADMIN });
    await expect(service.create(owner, 'a@b.com')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('creates the invite with a hashed token and emails the link', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ isOwner: true })
      .mockResolvedValueOnce(null);
    tx.adminInvite.create.mockResolvedValue({ id: 'i1', email: 'a@b.com' });
    email.send.mockResolvedValue(true);

    const result = await service.create(owner, ' A@B.com ');

    const data = tx.adminInvite.create.mock.calls[0][0].data;
    expect(data.email).toBe('a@b.com');
    expect(data.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(email.send).toHaveBeenCalledWith(
      'a@b.com',
      expect.any(String),
      expect.stringContaining('/admin-invite?token='),
    );
    expect(result.data.emailSent).toBe(true);
  });

  it('rejects an expired or used token', async () => {
    prisma.adminInvite.findUnique.mockResolvedValueOnce({
      id: 'i1',
      email: 'a@b.com',
      expiresAt: new Date(Date.now() - 1000),
      acceptedAt: null,
      revokedAt: null,
    });
    await expect(
      service.accept(invitee, 'x'.repeat(30)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a signed-in user whose email does not match the invite', async () => {
    prisma.adminInvite.findUnique.mockResolvedValueOnce({
      id: 'i1',
      email: 'a@b.com',
      expiresAt: new Date(Date.now() + 100000),
      acceptedAt: null,
      revokedAt: null,
    });
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'u1',
      email: 'other@b.com',
      status: AccountStatus.ACTIVE,
    });
    await expect(
      service.accept(invitee, 'x'.repeat(30)),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it('promotes the matching user and marks the invite accepted', async () => {
    prisma.adminInvite.findUnique.mockResolvedValueOnce({
      id: 'i1',
      email: 'a@b.com',
      invitedById: 'o1',
      expiresAt: new Date(Date.now() + 100000),
      acceptedAt: null,
      revokedAt: null,
    });
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'u1',
      email: 'A@b.com',
      status: AccountStatus.ACTIVE,
    });

    const result = await service.accept(invitee, 'x'.repeat(30));

    expect(result.data.role).toBe(Role.ADMIN);
    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          role: Role.ADMIN,
          activeRole: Role.ADMIN,
          hasClientAccount: false,
        },
      }),
    );
    expect(tx.adminInvite.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'i1' } }),
    );
  });
});
