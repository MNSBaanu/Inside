import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PaymentStatus, Role } from '@inside/database';
import type { AuthUser } from '../auth/auth.service';
import { ActivityService } from '../activity/activity.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  const prisma = {
    milestonePayment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    project: { findUnique: jest.fn() },
  };

  const notifications = { notify: jest.fn() };
  const activity = { log: jest.fn() };

  const client = {
    id: 'c1',
    role: Role.CLIENT,
    activeRole: Role.CLIENT,
  } as AuthUser;

  const designer = {
    id: 'd1',
    role: Role.DESIGNER,
    activeRole: Role.DESIGNER,
  } as AuthUser;

  const pendingPayment = {
    id: 'pay1',
    projectId: 'p1',
    stageId: 's1',
    amount: 50000,
    status: PaymentStatus.PENDING,
    stripeIntentId: null,
    paidAt: null,
    releasedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    project: { id: 'p1', clientId: 'c1', designerId: 'd1', title: 'Sofa' },
  };

  let service: PaymentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PaymentsService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
      activity as unknown as ActivityService,
    );
  });

  it('client marks payment paid', async () => {
    prisma.milestonePayment.findUnique.mockResolvedValue(pendingPayment);
    prisma.milestonePayment.update.mockResolvedValue({
      ...pendingPayment,
      status: PaymentStatus.PAID,
      paidAt: new Date(),
    });
    const result = await service.markPaid(client, 'pay1', {
      stripeIntentId: 'pi_1',
    });
    expect(result.data.payment.status).toBe(PaymentStatus.PAID);
  });

  it('rejects pay by designer', async () => {
    prisma.milestonePayment.findUnique.mockResolvedValue(pendingPayment);
    await expect(service.markPaid(designer, 'pay1', {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects release on pending payment', async () => {
    prisma.milestonePayment.findUnique.mockResolvedValue(pendingPayment);
    await expect(service.release(client, 'pay1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('releases paid payment', async () => {
    prisma.milestonePayment.findUnique.mockResolvedValue({
      ...pendingPayment,
      status: PaymentStatus.PAID,
      paidAt: new Date(),
    });
    prisma.milestonePayment.update.mockResolvedValue({
      ...pendingPayment,
      status: PaymentStatus.RELEASED,
      releasedAt: new Date(),
    });
    const result = await service.release(client, 'pay1');
    expect(result.data.payment.status).toBe(PaymentStatus.RELEASED);
  });
});
