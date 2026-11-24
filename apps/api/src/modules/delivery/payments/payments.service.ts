import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  NotificationType,
  PaymentStatus,
  Prisma,
  ProjectStatus,
  Role,
} from '@inside/database';
import { formatLkr } from '../../../common/format';
import type { AuthUser } from '../../identity/auth/auth.service';
import { ActivityService } from '../../platform/activity/activity.service';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { PrismaService } from '../../../database/prisma.service';
import Stripe from 'stripe';
import { PayPaymentDto } from './dto/pay-payment.dto';
import { STRIPE } from './stripe.provider';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly activity: ActivityService,
    @Inject(STRIPE) private readonly stripe: Stripe | null,
  ) {}

  async listByProject(user: AuthUser, projectId: string) {
    const project = await this.requireParty(projectId, user);
    await this.reconcilePending(project.id);
    const items = await this.prisma.milestonePayment.findMany({
      where: { projectId: project.id },
      include: { stage: { select: { name: true } } },
      orderBy: [{ stage: { stageOrder: 'asc' } }, { createdAt: 'asc' }],
    });
    return {
      success: true,
      data: {
        items: items.map((p) => ({
          ...this.serialize(p),
          stageName: p.stage.name,
        })),
      },
    };
  }

  /**
   * One Stripe payment per milestone: a retry reuses it, so a client whose
   * confirmation never reached us cannot be charged twice.
   */
  async createCheckout(user: AuthUser, id: string) {
    const payment = await this.requirePendingForClient(user, id);
    const stripe = this.requireStripe();
    const amount = Math.round(Number(payment.amount) * 100);

    if (payment.stripeIntentId) {
      const existing = await stripe.paymentIntents
        .retrieve(payment.stripeIntentId)
        .catch(() => null);
      if (existing?.status === 'succeeded') {
        await this.recordPaid(payment, existing.id);
        return { success: true, data: { alreadyPaid: true } };
      }
      if (existing?.status === 'processing') {
        throw new ConflictException(
          'Your last payment for this milestone is still processing. Check back in a few minutes.',
        );
      }
      if (
        existing &&
        existing.status !== 'canceled' &&
        existing.amount === amount &&
        existing.client_secret
      ) {
        return {
          success: true,
          data: { clientSecret: existing.client_secret },
        };
      }
    }

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'lkr',
      payment_method_types: ['card'],
      description: `${payment.project.title} milestone`,
      metadata: { paymentId: id },
    });
    await this.prisma.milestonePayment.update({
      where: { id },
      data: { stripeIntentId: intent.id },
    });

    return { success: true, data: { clientSecret: intent.client_secret } };
  }

  async markPaid(user: AuthUser, id: string, dto: PayPaymentDto) {
    const payment = await this.requirePendingForClient(user, id);
    const stripe = this.requireStripe();

    const intent = await stripe.paymentIntents
      .retrieve(dto.paymentIntentId)
      .catch(() => {
        throw new BadRequestException('Invalid payment');
      });
    if (intent.metadata?.paymentId !== id || intent.status !== 'succeeded') {
      throw new BadRequestException('Payment has not been completed');
    }

    const updated = await this.recordPaid(payment, intent.id);
    if (!updated) {
      throw new ConflictException('This payment was already recorded');
    }
    return { success: true, data: { payment: this.serialize(updated) } };
  }

  /**
   * The invoice for a paid milestone, read from Stripe. Card details and the
   * Stripe receipt link are shown only to the client who paid and to admins.
   */
  async invoice(user: AuthUser, id: string) {
    const payment = await this.prisma.milestonePayment.findUnique({
      where: { id },
      include: {
        stage: { select: { name: true } },
        project: {
          select: {
            id: true,
            title: true,
            clientId: true,
            designerId: true,
            client: { select: { name: true } },
            designer: { select: { name: true } },
          },
        },
      },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    const isAdmin = user.role === Role.ADMIN;
    const isPayer = payment.project.clientId === user.id;
    if (!isAdmin && !isPayer && payment.project.designerId !== user.id) {
      throw new ForbiddenException('You do not have access to this payment');
    }
    if (payment.status === PaymentStatus.PENDING) {
      throw new BadRequestException('This milestone has not been paid yet');
    }
    if (!payment.stripeIntentId) {
      throw new NotFoundException(
        'This payment was not made through Stripe, so there is no invoice for it',
      );
    }

    const intent = await this.requireStripe()
      .paymentIntents.retrieve(payment.stripeIntentId, {
        expand: ['latest_charge'],
      })
      .catch(() => {
        throw new ServiceUnavailableException(
          'Could not load this payment from Stripe. Try again shortly.',
        );
      });
    const charge =
      intent.latest_charge && typeof intent.latest_charge === 'object'
        ? intent.latest_charge
        : null;
    const card = charge?.payment_method_details?.card;
    const showPayment = isAdmin || isPayer;
    const minor = (value: number) => value / 100;

    return {
      success: true,
      data: {
        invoice: {
          number: `INS-${payment.id.slice(0, 8).toUpperCase()}`,
          paymentId: payment.id,
          status: payment.status,
          project: { id: payment.project.id, title: payment.project.title },
          stage: payment.stage.name,
          client: payment.project.client.name,
          designer: payment.project.designer.name,
          amount: minor(intent.amount_received || intent.amount),
          amountRefunded: minor(charge?.amount_refunded ?? 0),
          currency: intent.currency.toUpperCase(),
          paidAt: charge ? new Date(charge.created * 1000) : payment.paidAt,
          releasedAt: payment.releasedAt,
          stripeReference: intent.id,
          receiptNumber: charge?.receipt_number ?? null,
          receiptUrl: showPayment ? (charge?.receipt_url ?? null) : null,
          card:
            showPayment && card
              ? { brand: card.brand, last4: card.last4 }
              : null,
          billingName: showPayment
            ? (charge?.billing_details?.name ?? null)
            : null,
        },
      },
    };
  }

  /** Records milestones Stripe has taken payment for but the browser never confirmed. */
  private async reconcilePending(projectId: string) {
    if (!this.stripe) return;
    const waiting = await this.prisma.milestonePayment.findMany({
      where: {
        projectId,
        status: PaymentStatus.PENDING,
        stripeIntentId: { not: null },
      },
      include: {
        project: { select: { designerId: true, clientId: true, title: true } },
      },
    });
    for (const payment of waiting) {
      const intent = await this.stripe.paymentIntents
        .retrieve(payment.stripeIntentId!)
        .catch(() => null);
      if (
        intent?.status === 'succeeded' &&
        intent.metadata?.paymentId === payment.id
      ) {
        await this.recordPaid(payment, intent.id);
      }
    }
  }

  /** Marks a pending milestone paid once. Returns null if it was already recorded. */
  private async recordPaid(
    payment: {
      id: string;
      projectId: string;
      amount: unknown;
      project: { designerId: string; clientId: string; title: string };
    },
    intentId: string,
  ) {
    let updated;
    try {
      updated = await this.prisma.milestonePayment.update({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
          stripeIntentId: intentId,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2002' || error.code === 'P2025')
      ) {
        return null;
      }
      throw error;
    }

    await this.notifications.notify({
      userId: payment.project.designerId,
      type: NotificationType.PAYMENT,
      title: 'Milestone paid',
      message: `Client paid ${formatLkr(payment.amount)} for "${payment.project.title}"`,
      metadata: { projectId: payment.projectId, paymentId: payment.id },
    });
    await this.activity.log({
      projectId: payment.projectId,
      userId: payment.project.clientId,
      action: 'PAYMENT_PAID',
      metadata: { paymentId: payment.id, amount: Number(payment.amount) },
    });
    return updated;
  }

  /**
   * Closes an active or on-hold project, then refunds milestones that were
   * paid but not released. The project is claimed first so two cancels can't
   * both refund, and each payment is claimed before Stripe is called so a
   * stage approved at the same moment is never refunded after release.
   */
  async cancelAndRefund(projectId: string) {
    const closed = await this.prisma.project.updateMany({
      where: {
        id: projectId,
        status: { in: [ProjectStatus.ACTIVE, ProjectStatus.ON_HOLD] },
      },
      data: { status: ProjectStatus.CANCELLED },
    });
    if (closed.count === 0) {
      throw new ConflictException('Project is already closed');
    }

    const paid = await this.prisma.milestonePayment.findMany({
      where: { projectId, status: PaymentStatus.PAID },
    });
    let refunded = 0;
    let failed = 0;
    for (const payment of paid) {
      const claimed = await this.prisma.milestonePayment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PAID },
        data: { status: PaymentStatus.REFUNDED },
      });
      if (claimed.count === 0) continue;
      if (payment.stripeIntentId) {
        try {
          await this.requireStripe().refunds.create(
            { payment_intent: payment.stripeIntentId },
            { idempotencyKey: `refund-${payment.id}` },
          );
        } catch (error) {
          await this.prisma.milestonePayment.update({
            where: { id: payment.id },
            data: { status: PaymentStatus.PAID },
          });
          this.logger.error(
            `Refund failed for payment ${payment.id}: ${error instanceof Error ? error.message : 'unknown'}`,
          );
          failed += 1;
          continue;
        }
      }
      refunded += 1;
    }
    return { refunded, failed };
  }

  private async requirePendingForClient(user: AuthUser, id: string) {
    const payment = await this.requirePayment(id);
    if (payment.project.clientId !== user.id) {
      throw new ForbiddenException('Only the client can pay this milestone');
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment is not pending');
    }
    if (payment.project.status === ProjectStatus.CANCELLED) {
      throw new BadRequestException('This project was cancelled');
    }
    return payment;
  }

  private requireStripe() {
    if (!this.stripe) {
      throw new ServiceUnavailableException(
        'Payments are not available right now. Please try again later.',
      );
    }
    return this.stripe;
  }

  private async requirePayment(id: string) {
    const payment = await this.prisma.milestonePayment.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            clientId: true,
            designerId: true,
            title: true,
            status: true,
          },
        },
      },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  private async requireParty(projectId: string, user: AuthUser) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, clientId: true, designerId: true },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.clientId !== user.id && project.designerId !== user.id) {
      throw new ForbiddenException('You do not have access to this project');
    }
    return project;
  }

  private serialize(p: {
    id: string;
    projectId: string;
    stageId: string;
    amount: unknown;
    status: PaymentStatus;
    stripeIntentId: string | null;
    paidAt: Date | null;
    releasedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: p.id,
      projectId: p.projectId,
      stageId: p.stageId,
      amount: p.amount !== null ? Number(p.amount) : null,
      status: p.status,
      stripeIntentId: p.stripeIntentId,
      paidAt: p.paidAt,
      releasedAt: p.releasedAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }
}
