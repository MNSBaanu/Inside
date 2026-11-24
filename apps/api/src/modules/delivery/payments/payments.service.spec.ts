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
      updateMany: jest.fn(),
    },
    project: { findUnique: jest.fn(), updateMany: jest.fn() },
  };

  const notifications = { notify: jest.fn() };
  const activity = { log: jest.fn() };
  const stripe = {
    paymentIntents: { create: jest.fn(), retrieve: jest.fn() },
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
    prisma.milestonePayment.findMany.mockResolvedValue([
      { id: 'pay1', stripeIntentId: 'pi_1' },
    ]);
    prisma.milestonePayment.updateMany.mockResolvedValue({ count: 0 });
    const result = await service.cancelAndRefund('p1');
    expect(result).toEqual({ refunded: 0, failed: 0 });
    expect(stripe.refunds.create).not.toHaveBeenCalled();
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

    it('gives the client the card and receipt from Stripe', async () => {
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
        receiptUrl: 'https://pay.stripe.com/receipts/x',
      });
    });

    it('hides card details and the receipt link from the designer', async () => {
      prisma.milestonePayment.findUnique.mockResolvedValue(paidPayment);
      stripe.paymentIntents.retrieve.mockResolvedValue(intent);
      const { data } = await service.invoice(designer, 'pay1');
      expect(data.invoice.card).toBeNull();
      expect(data.invoice.receiptUrl).toBeNull();
      expect(data.invoice.billingName).toBeNull();
      expect(data.invoice.amount).toBe(50000);
    });

    it('refuses someone outside the project', async () => {
      prisma.milestonePayment.findUnique.mockResolvedValue(paidPayment);
      await expect(
        service.invoice({ id: 'x', role: Role.CLIENT } as AuthUser, 'pay1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
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
});
