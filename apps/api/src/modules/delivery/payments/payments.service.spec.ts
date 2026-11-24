import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PaymentStatus, Role } from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import type Stripe from 'stripe';
import { ActivityService } from '../../platform/activity/activity.service';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { PrismaService } from '../../../database/prisma.service';
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
  const stripe = {
    paymentIntents: { create: jest.fn(), retrieve: jest.fn() },
  };

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
      stripe as unknown as Stripe,
    );
  });

  it('creates a payment intent for the client', async () => {
    prisma.milestonePayment.findUnique.mockResolvedValue(pendingPayment);
    stripe.paymentIntents.create.mockResolvedValue({
      client_secret: 'cs_1_secret',
    });
    const result = await service.createCheckout(client, 'pay1');
    expect(result.data.clientSecret).toBe('cs_1_secret');
    expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_method_types: ['card'],
        metadata: { paymentId: 'pay1' },
      }),
    );
  });

  it('client marks payment paid after Stripe confirms', async () => {
    prisma.milestonePayment.findUnique.mockResolvedValue(pendingPayment);
    stripe.paymentIntents.retrieve.mockResolvedValue({
      id: 'pi_1',
      metadata: { paymentId: 'pay1' },
      status: 'succeeded',
    });
    prisma.milestonePayment.update.mockResolvedValue({
      ...pendingPayment,
      status: PaymentStatus.PAID,
      paidAt: new Date(),
    });
    const result = await service.markPaid(client, 'pay1', {
      paymentIntentId: 'pi_1',
    });
    expect(result.data.payment.status).toBe(PaymentStatus.PAID);
    expect(prisma.milestonePayment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ stripeIntentId: 'pi_1' }),
      }),
    );
  });

  it('rejects an unpaid payment intent', async () => {
    prisma.milestonePayment.findUnique.mockResolvedValue(pendingPayment);
    stripe.paymentIntents.retrieve.mockResolvedValue({
      id: 'pi_1',
      metadata: { paymentId: 'pay1' },
      status: 'requires_payment_method',
    });
    await expect(
      service.markPaid(client, 'pay1', { paymentIntentId: 'pi_1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.milestonePayment.update).not.toHaveBeenCalled();
  });

  it('rejects pay by designer', async () => {
    prisma.milestonePayment.findUnique.mockResolvedValue(pendingPayment);
    await expect(
      service.markPaid(designer, 'pay1', { paymentIntentId: 'pi_1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
