import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Role, VerificationStatus } from '@inside/database';
import type { AuthUser } from '../auth/auth.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationsService } from './verifications.service';

describe('VerificationsService', () => {
  const tx = {
    verification: { update: jest.fn() },
    user: { update: jest.fn() },
  };

  const prisma = {
    verification: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: { update: jest.fn() },
    $transaction: jest.fn(async (fn: (t: typeof tx) => Promise<unknown>) =>
      fn(tx),
    ),
  };

  const notifications = { notify: jest.fn() };

  const designer = {
    id: 'd1',
    role: Role.DESIGNER,
    activeRole: Role.DESIGNER,
  } as AuthUser;

  const admin = { id: 'a1', role: Role.ADMIN } as AuthUser;

  let service: VerificationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VerificationsService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
    );
  });

  it('rejects duplicate pending submission', async () => {
    prisma.verification.findFirst.mockResolvedValue({ id: 'v1' });
    await expect(
      service.submit(designer, { evidenceUrl: 'x' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates verification when no pending', async () => {
    prisma.verification.findFirst.mockResolvedValue(null);
    prisma.verification.create.mockResolvedValue({
      id: 'v1',
      designerId: 'd1',
      status: VerificationStatus.PENDING,
      evidenceUrl: 'x',
      notes: null,
      reviewedById: null,
      reviewedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const result = await service.submit(designer, { evidenceUrl: 'x' });
    expect(result.data.verification.status).toBe(VerificationStatus.PENDING);
  });

  it('approve sets user.isVerified true', async () => {
    prisma.verification.findUnique.mockResolvedValue({
      id: 'v1',
      designerId: 'd1',
      status: VerificationStatus.PENDING,
    });
    tx.verification.update.mockResolvedValue({
      id: 'v1',
      designerId: 'd1',
      status: VerificationStatus.APPROVED,
      evidenceUrl: 'x',
      notes: null,
      reviewedById: 'a1',
      reviewedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.approve(admin, 'v1');
    expect(result.data.verification.status).toBe(VerificationStatus.APPROVED);
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 'd1' },
      data: { isVerified: true },
    });
  });

  it('approve 404 on missing verification', async () => {
    prisma.verification.findUnique.mockResolvedValue(null);
    await expect(service.approve(admin, 'v1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
