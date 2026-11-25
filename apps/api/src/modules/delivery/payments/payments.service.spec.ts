import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  PaymentMethod,
  PaymentStatus,
  ProjectStatus,
  Role,
} from '@inside/database';
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
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    project: { findUnique: jest.fn(), updateMany: jest.fn() },
    user: { findMany: jest.fn() },
  };

  const notifications = {
    notify: jest.fn(),
    notifyMany: jest.fn(),
    notifyAdmins: jest.fn(),
  };
  const activity = { log: jest.fn() };
  const stripe = {
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
      cancel: jest.fn(),
    },
    refunds: { create: jest.fn() },
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
    method: PaymentMethod.CARD,
    reference: null,
    proofUrl: null,
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

  it('reuses the open Stripe payment instead of charging again', async () => {
    prisma.milestonePayment.findUnique.mockResolvedValue({
      ...pendingPayment,
      stripeIntentId: 'pi_1',
    });
    stripe.paymentIntents.retrieve.mockResolvedValue({
      id: 'pi_1',
      status: 'requires_payment_method',
      amount: 5000000,
      client_secret: 'cs_existing',
    });
    const result = await service.createCheckout(client, 'pay1');
    expect(result.data.clientSecret).toBe('cs_existing');
    expect(stripe.paymentIntents.create).not.toHaveBeenCalled();
  });

  it('records a payment Stripe already took instead of opening a new one', async () => {
    prisma.milestonePayment.findUnique.mockResolvedValue({
      ...pendingPayment,
      stripeIntentId: 'pi_1',
    });
    stripe.paymentIntents.retrieve.mockResolvedValue({
      id: 'pi_1',
      status: 'succeeded',
      amount: 5000000,
      metadata: { paymentId: 'pay1' },
    });
    prisma.milestonePayment.update.mockResolvedValue({
      ...pendingPayment,
      status: PaymentStatus.PAID,
    });
    const result = await service.createCheckout(client, 'pay1');
    expect(result.data).toEqual({ alreadyPaid: true });
    expect(stripe.paymentIntents.create).not.toHaveBeenCalled();
    expect(prisma.milestonePayment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pay1', status: PaymentStatus.PENDING },
      }),
    );
  });

  it('skips refunding a payment that was released before it was claimed', async () => {
    prisma.project.updateMany.mockResolvedValue({ count: 1 });
    prisma.milestonePayment.findMany.mockResolvedValueOnce([]);
    prisma.milestonePayment.findMany.mockResolvedValueOnce([
      { id: 'pay1', stripeIntentId: 'pi_1', method: PaymentMethod.CARD },
    ]);
    prisma.milestonePayment.updateMany.mockResolvedValue({ count: 0 });
    const result = await service.cancelAndRefund('p1');
    expect(result).toEqual({ refunded: 0, failed: 0, offline: 0 });
    expect(stripe.refunds.create).not.toHaveBeenCalled();
  });

  it('leaves offline payments for an admin to refund by hand', async () => {
    prisma.project.updateMany.mockResolvedValue({ count: 1 });
    prisma.milestonePayment.findMany.mockResolvedValueOnce([]);
    prisma.milestonePayment.findMany.mockResolvedValueOnce([
      { id: 'pay1', stripeIntentId: null, method: PaymentMethod.BANK_TRANSFER },
    ]);
    prisma.project.findUnique.mockResolvedValue({ title: 'Sofa' });
    const result = await service.cancelAndRefund('p1');
    expect(result).toEqual({ refunded: 0, failed: 0, offline: 1 });
    expect(prisma.milestonePayment.updateMany).not.toHaveBeenCalled();
    // Admins can't open the project workspace, so the alert opens the admin page.
    expect(notifications.notifyAdmins).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Offline refund needed',
        metadata: { projectId: 'p1', href: '/admin/projects/p1' },
      }),
    );
  });

  describe('offline payments', () => {
    const admin = { id: 'a1', role: Role.ADMIN } as AuthUser;
    const pendingWithProject = {
      ...pendingPayment,
      project: { ...pendingPayment.project, status: ProjectStatus.ACTIVE },
    };

    it('records a bank transfer and cancels the open card checkout', async () => {
      prisma.milestonePayment.findUnique.mockResolvedValue({
        ...pendingWithProject,
        stripeIntentId: 'pi_1',
      });
      stripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_1',
        status: 'requires_payment_method',
      });
      stripe.paymentIntents.cancel.mockResolvedValue({});
      prisma.milestonePayment.update.mockResolvedValue({
        ...pendingPayment,
        status: PaymentStatus.PAID,
        method: PaymentMethod.BANK_TRANSFER,
      });
      await service.recordOffline(admin, 'pay1', {
        method: 'BANK_TRANSFER',
        paidOn: '2026-11-20',
        reference: 'BOC 004512',
      });
      expect(stripe.paymentIntents.cancel).toHaveBeenCalledWith('pi_1');
      expect(prisma.milestonePayment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pay1', status: PaymentStatus.PENDING },
          data: expect.objectContaining({
            status: PaymentStatus.PAID,
            method: PaymentMethod.BANK_TRANSFER,
            reference: 'BOC 004512',
            recordedById: 'a1',
            stripeIntentId: null,
          }),
        }),
      );
      expect(notifications.notifyMany).toHaveBeenCalledWith(
        ['c1', 'd1'],
        expect.objectContaining({ title: 'Milestone paid' }),
      );
    });

    it('does not record an offline payment the client already paid by card', async () => {
      prisma.milestonePayment.findUnique.mockResolvedValue({
        ...pendingWithProject,
        stripeIntentId: 'pi_1',
      });
      stripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_1',
        status: 'succeeded',
        metadata: { paymentId: 'pay1' },
      });
      prisma.milestonePayment.update.mockResolvedValue({
        ...pendingPayment,
        status: PaymentStatus.PAID,
      });
      await expect(
        service.recordOffline(admin, 'pay1', {
          method: 'CASH',
          paidOn: '2026-11-20',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.milestonePayment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ stripeIntentId: 'pi_1' }),
        }),
      );
    });

    it('does not record offline when the card checkout cannot be closed', async () => {
      prisma.milestonePayment.findUnique.mockResolvedValue({
        ...pendingWithProject,
        stripeIntentId: 'pi_1',
      });
      stripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_1',
        status: 'requires_payment_method',
      });
      stripe.paymentIntents.cancel.mockRejectedValue(new Error('stripe down'));
      await expect(
        service.recordOffline(admin, 'pay1', {
          method: 'CASH',
          paidOn: '2026-11-20',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.milestonePayment.update).not.toHaveBeenCalled();
    });

    it('retries a failed card refund on a cancelled project', async () => {
      prisma.milestonePayment.findUnique.mockResolvedValue({
        ...pendingPayment,
        status: PaymentStatus.PAID,
        stripeIntentId: 'pi_1',
        project: { ...pendingPayment.project, status: ProjectStatus.CANCELLED },
      });
      prisma.milestonePayment.updateMany.mockResolvedValue({ count: 1 });
      stripe.refunds.create.mockResolvedValue({});
      await service.retryCardRefund(admin, 'pay1');
      expect(stripe.refunds.create).toHaveBeenCalledWith(
        { payment_intent: 'pi_1' },
        { idempotencyKey: 'refund-pay1' },
      );
      expect(notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'c1', title: 'Payment refunded' }),
      );
    });

    it('rejects a payment date in the future', async () => {
      prisma.milestonePayment.findUnique.mockResolvedValue(pendingWithProject);
      await expect(
        service.recordOffline(admin, 'pay1', {
          method: 'CASH',
          paidOn: '2999-01-01',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("accepts today's date in Sri Lanka before it is today in UTC", async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-11-24T20:30:00Z'));
      try {
        prisma.milestonePayment.findUnique.mockResolvedValue(
          pendingWithProject,
        );
        prisma.milestonePayment.update.mockResolvedValue({
          ...pendingPayment,
          status: PaymentStatus.PAID,
          method: PaymentMethod.CASH,
        });
        await service.recordOffline(admin, 'pay1', {
          method: 'CASH',
          paidOn: '2026-11-25',
        });
        expect(prisma.milestonePayment.update).toHaveBeenCalled();
      } finally {
        jest.useRealTimers();
      }
    });

    it('only marks offline payments on cancelled projects as refunded', async () => {
      prisma.milestonePayment.findUnique.mockResolvedValue({
        ...pendingPayment,
        status: PaymentStatus.PAID,
        method: PaymentMethod.CASH,
        project: { ...pendingPayment.project, status: ProjectStatus.ACTIVE },
      });
      await expect(
        service.markOfflineRefunded(admin, 'pay1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  it('closes open card checkouts when a project is cancelled', async () => {
    prisma.project.updateMany.mockResolvedValue({ count: 1 });
    prisma.milestonePayment.findMany.mockResolvedValueOnce([
      { ...pendingPayment, stripeIntentId: 'pi_1' },
    ]);
    prisma.milestonePayment.findMany.mockResolvedValueOnce([]);
    stripe.paymentIntents.retrieve.mockResolvedValue({
      id: 'pi_1',
      status: 'requires_payment_method',
    });
    stripe.paymentIntents.cancel.mockResolvedValue({});
    await service.cancelAndRefund('p1');
    expect(stripe.paymentIntents.cancel).toHaveBeenCalledWith('pi_1');
  });

  it('refunds a card payment that lands after the project was cancelled', async () => {
    prisma.milestonePayment.findMany.mockResolvedValueOnce([
      { ...pendingPayment, stripeIntentId: 'pi_1' },
    ]);
    prisma.milestonePayment.findMany.mockResolvedValueOnce([]);
    prisma.project.findUnique
      .mockResolvedValueOnce({ id: 'p1', clientId: 'c1', designerId: 'd1' })
      .mockResolvedValueOnce({ status: ProjectStatus.CANCELLED });
    stripe.paymentIntents.retrieve.mockResolvedValue({
      id: 'pi_1',
      status: 'succeeded',
      metadata: { paymentId: 'pay1' },
    });
    prisma.milestonePayment.update.mockResolvedValue({
      ...pendingPayment,
      status: PaymentStatus.PAID,
      stripeIntentId: 'pi_1',
    });
    prisma.milestonePayment.updateMany.mockResolvedValue({ count: 1 });
    prisma.milestonePayment.findUniqueOrThrow.mockResolvedValue({
      ...pendingPayment,
      status: PaymentStatus.REFUNDED,
    });
    stripe.refunds.create.mockResolvedValue({});
    await service.listByProject(client, 'p1');
    expect(stripe.refunds.create).toHaveBeenCalledWith(
      { payment_intent: 'pi_1' },
      { idempotencyKey: 'refund-pay1' },
    );
    expect(notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'c1', title: 'Payment refunded' }),
    );
  });

  it('will not cancel and refund a project twice', async () => {
    prisma.project.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.cancelAndRefund('p1')).rejects.toThrow(
      'Project is already closed',
    );
    expect(prisma.milestonePayment.findMany).not.toHaveBeenCalled();
  });

  describe('invoice', () => {
    const paidPayment = {
      ...pendingPayment,
      status: PaymentStatus.PAID,
      stripeIntentId: 'pi_1',
      stage: { name: 'DESIGN' },
      project: {
        ...pendingPayment.project,
        client: { name: 'Nadia' },
        designer: { name: 'Ravi' },
      },
    };
    const intent = {
      id: 'pi_1',
      amount: 5000000,
      amount_received: 5000000,
      currency: 'lkr',
      latest_charge: {
        id: 'ch_1',
        created: 1_700_000_000,
        amount_refunded: 0,
        receipt_number: '1234-5678',
        receipt_url: 'https://pay.stripe.com/receipts/x',
        billing_details: { name: 'Nadia Client' },
        payment_method_details: { card: { brand: 'visa', last4: '4242' } },
      },
    };

    it('gives the client the card details from Stripe', async () => {
      prisma.milestonePayment.findUnique.mockResolvedValue(paidPayment);
      stripe.paymentIntents.retrieve.mockResolvedValue(intent);
      const { data } = await service.invoice(client, 'pay1');
      expect(stripe.paymentIntents.retrieve).toHaveBeenCalledWith('pi_1', {
        expand: ['latest_charge'],
      });
      expect(data.invoice).toMatchObject({
        amount: 50000,
        currency: 'LKR',
        card: { brand: 'visa', last4: '4242' },
        billingName: 'Nadia Client',
      });
      expect(data.invoice).not.toHaveProperty('receiptUrl');
      expect(data.invoice).not.toHaveProperty('stripeReference');
    });

    it('hides card details from the designer', async () => {
      prisma.milestonePayment.findUnique.mockResolvedValue(paidPayment);
      stripe.paymentIntents.retrieve.mockResolvedValue(intent);
      const { data } = await service.invoice(designer, 'pay1');
      expect(data.invoice.card).toBeNull();
      expect(data.invoice.billingName).toBeNull();
      expect(data.invoice.amount).toBe(50000);
    });

    it('refuses someone outside the project', async () => {
      prisma.milestonePayment.findUnique.mockResolvedValue(paidPayment);
      await expect(
        service.invoice({ id: 'x', role: Role.CLIENT } as AuthUser, 'pay1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('builds the invoice from the payment record when there is no card record', async () => {
      prisma.milestonePayment.findUnique.mockResolvedValue({
        ...paidPayment,
        stripeIntentId: null,
        paidAt: new Date('2026-11-05'),
      });
      const { data } = await service.invoice(client, 'pay1');
      expect(stripe.paymentIntents.retrieve).not.toHaveBeenCalled();
      expect(data.invoice).toMatchObject({
        amount: 50000,
        currency: 'LKR',
        card: null,
      });
    });

    it('falls back to the payment record when card details cannot be loaded', async () => {
      prisma.milestonePayment.findUnique.mockResolvedValue(paidPayment);
      stripe.paymentIntents.retrieve.mockRejectedValue(new Error('network'));
      const { data } = await service.invoice(client, 'pay1');
      expect(data.invoice).toMatchObject({ amount: 50000, card: null });
    });

    it('has no invoice before the milestone is paid', async () => {
      prisma.milestonePayment.findUnique.mockResolvedValue({
        ...paidPayment,
        status: PaymentStatus.PENDING,
        stripeIntentId: null,
      });
      await expect(service.invoice(client, 'pay1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
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

  it('does not open a second checkout when the last one cannot be checked', async () => {
    prisma.milestonePayment.findUnique.mockResolvedValue({
      ...pendingPayment,
      stripeIntentId: 'pi_1',
    });
    stripe.paymentIntents.retrieve.mockRejectedValueOnce(new Error('down'));
    await expect(service.createCheckout(client, 'pay1')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(stripe.paymentIntents.create).not.toHaveBeenCalled();
    expect(prisma.milestonePayment.update).not.toHaveBeenCalled();
  });

  it('closes the old checkout before opening one for a new amount', async () => {
    prisma.milestonePayment.findUnique.mockResolvedValue({
      ...pendingPayment,
      stripeIntentId: 'pi_old',
    });
    stripe.paymentIntents.retrieve.mockResolvedValue({
      id: 'pi_old',
      status: 'requires_payment_method',
      amount: 100,
      client_secret: 'cs_old',
    });
    stripe.paymentIntents.cancel.mockResolvedValue({});
    stripe.paymentIntents.create.mockResolvedValue({
      id: 'pi_new',
      client_secret: 'cs_new',
    });
    const result = await service.createCheckout(client, 'pay1');
    expect(stripe.paymentIntents.cancel).toHaveBeenCalledWith('pi_old');
    expect(result.data.clientSecret).toBe('cs_new');
  });

  it('treats a confirmation for an already recorded payment as success', async () => {
    prisma.milestonePayment.findUnique.mockResolvedValue({
      ...pendingPayment,
      status: PaymentStatus.PAID,
      stripeIntentId: 'pi_1',
    });
    const result = await service.markPaid(client, 'pay1', {
      paymentIntentId: 'pi_1',
    });
    expect(result.data.payment.status).toBe(PaymentStatus.PAID);
    expect(stripe.paymentIntents.retrieve).not.toHaveBeenCalled();
  });

  it('records and refunds a card payment confirmed after the project was cancelled', async () => {
    prisma.milestonePayment.findUnique.mockResolvedValue({
      ...pendingPayment,
      project: { ...pendingPayment.project, status: ProjectStatus.CANCELLED },
    });
    stripe.paymentIntents.retrieve.mockResolvedValue({
      id: 'pi_1',
      metadata: { paymentId: 'pay1' },
      status: 'succeeded',
    });
    prisma.milestonePayment.update.mockResolvedValue({
      ...pendingPayment,
      status: PaymentStatus.PAID,
      stripeIntentId: 'pi_1',
    });
    prisma.project.findUnique.mockResolvedValue({
      status: ProjectStatus.CANCELLED,
    });
    prisma.milestonePayment.updateMany.mockResolvedValue({ count: 1 });
    stripe.refunds.create.mockResolvedValue({});
    prisma.milestonePayment.findUniqueOrThrow.mockResolvedValue({
      ...pendingPayment,
      status: PaymentStatus.REFUNDED,
      stripeIntentId: 'pi_1',
    });
    const result = await service.markPaid(client, 'pay1', {
      paymentIntentId: 'pi_1',
    });
    expect(stripe.refunds.create).toHaveBeenCalled();
    expect(result.data.payment.status).toBe(PaymentStatus.REFUNDED);
  });
});
