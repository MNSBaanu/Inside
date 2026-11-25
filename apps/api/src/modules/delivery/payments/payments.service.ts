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
  PaymentMethod,
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
import type { AdminRecordOfflinePaymentDto } from '../../trust/admin/dto/admin-manage.dto';
import { STRIPE } from './stripe.provider';

/** How cancelling a project settled its paid milestones, for the people told. */
export function refundNote(result: {
  refunded: number;
  failed: number;
  offline: number;
}) {
  const count = (n: number, one: string, many: string) =>
    `${n} ${n === 1 ? one : many}`;
  return [
    result.refunded
      ? `. ${count(result.refunded, 'paid milestone was', 'paid milestones were')} refunded to the card`
      : '',
    result.failed
      ? `. ${count(result.failed, 'card refund is', 'card refunds are')} delayed and the Inside team will retry ${result.failed === 1 ? 'it' : 'them'}`
      : '',
    result.offline
      ? `. ${count(result.offline, 'milestone', 'milestones')} paid offline will be refunded by the Inside team`
      : '',
  ].join('');
}

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
      // If the last checkout can't be looked up, stop: starting a new one
      // would forget it, and it may already have been paid.
      const existing = await stripe.paymentIntents
        .retrieve(payment.stripeIntentId)
        .catch(() => {
          throw new ServiceUnavailableException(
            'Could not check your last payment for this milestone. Please try again shortly.',
          );
        });
      if (existing.status === 'succeeded') {
        await this.recordPaid(payment, existing.id);
        return { success: true, data: { alreadyPaid: true } };
      }
      if (existing.status === 'processing') {
        throw new ConflictException(
          'Your last payment for this milestone is still processing. Check back in a few minutes.',
        );
      }
      if (existing.status !== 'canceled') {
        if (existing.amount === amount && existing.client_secret) {
          return {
            success: true,
            data: { clientSecret: existing.client_secret },
          };
        }
        // The amount changed: close the old checkout so it can't be paid too.
        await stripe.paymentIntents.cancel(existing.id).catch(() => {
          throw new ConflictException(
            'Your last checkout for this milestone could not be closed. Refresh and check whether it was paid before trying again.',
          );
        });
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

  /**
   * The client's browser confirms a card payment Stripe took. This still
   * records it on a cancelled project, which refunds it straight away, and a
   * payment already recorded from Stripe's side is not an error.
   */
  async markPaid(user: AuthUser, id: string, dto: PayPaymentDto) {
    const payment = await this.requirePayment(id);
    if (payment.project.clientId !== user.id) {
      throw new ForbiddenException('Only the client can pay this milestone');
    }
    if (payment.status !== PaymentStatus.PENDING) {
      if (payment.stripeIntentId === dto.paymentIntentId) {
        return { success: true, data: { payment: this.serialize(payment) } };
      }
      throw new BadRequestException('Payment is not pending');
    }
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
    if (updated) {
      return { success: true, data: { payment: this.serialize(updated) } };
    }
    // Recorded a moment ago by another request for this same payment.
    const current = await this.prisma.milestonePayment.findUniqueOrThrow({
      where: { id },
    });
    if (current.stripeIntentId === intent.id) {
      return { success: true, data: { payment: this.serialize(current) } };
    }
    throw new ConflictException('This payment was already recorded');
  }

  /**
   * The invoice for a paid milestone, read from Stripe. Card details and the
   * billing name are shown only to the client who paid and to admins.
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
    const showPayment = isAdmin || isPayer;
    const base = {
      number: `INS-${payment.id.slice(0, 8).toUpperCase()}`,
      paymentId: payment.id,
      status: payment.status,
      method: payment.method,
      project: { id: payment.project.id, title: payment.project.title },
      stage: payment.stage.name,
      client: payment.project.client.name,
      designer: payment.project.designer.name,
      releasedAt: payment.releasedAt,
    };

    // Built from Inside's own record when there are no card details to read:
    // offline payments, payments recorded before card checkout, or when the
    // card provider can't be reached.
    const fromRecord = () => {
      const amount = Number(payment.amount);
      return {
        success: true,
        data: {
          invoice: {
            ...base,
            amount,
            amountRefunded:
              payment.status === PaymentStatus.REFUNDED ? amount : 0,
            currency: 'LKR',
            paidAt: payment.paidAt,
            reference: payment.reference,
            proofUrl: showPayment ? payment.proofUrl : null,
            card: null,
            billingName: null,
          },
        },
      };
    };

    if (
      payment.method !== PaymentMethod.CARD ||
      !payment.stripeIntentId ||
      !this.stripe
    ) {
      return fromRecord();
    }

    const intent = await this.stripe.paymentIntents
      .retrieve(payment.stripeIntentId, { expand: ['latest_charge'] })
      .catch(() => null);
    if (!intent) {
      return fromRecord();
    }
    const charge =
      intent.latest_charge && typeof intent.latest_charge === 'object'
        ? intent.latest_charge
        : null;
    const card = charge?.payment_method_details?.card;
    const minor = (value: number) => value / 100;

    return {
      success: true,
      data: {
        invoice: {
          ...base,
          amount: minor(intent.amount_received || intent.amount),
          amountRefunded: minor(charge?.amount_refunded ?? 0),
          currency: intent.currency.toUpperCase(),
          paidAt: charge ? new Date(charge.created * 1000) : payment.paidAt,
          reference: null,
          proofUrl: null,
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

    const project = await this.prisma.project.findUnique({
      where: { id: payment.projectId },
      select: { status: true },
    });
    if (project?.status === ProjectStatus.CANCELLED) {
      const outcome = await this.refundCard(updated);
      if (outcome === 'refunded') {
        await this.notifications.notify({
          userId: payment.project.clientId,
          type: NotificationType.PAYMENT,
          title: 'Payment refunded',
          message: `Your ${formatLkr(payment.amount)} payment for "${payment.project.title}" was refunded because the project was cancelled`,
          metadata: { projectId: payment.projectId, paymentId: payment.id },
        });
      } else if (outcome === 'failed') {
        await this.notifyAdmins({
          title: 'Card refund failed',
          message: `A ${formatLkr(payment.amount)} card payment for "${payment.project.title}" came in after the project was cancelled and could not be refunded. Retry the refund from the project's payments.`,
          metadata: { projectId: payment.projectId, paymentId: payment.id },
        });
      }
      return this.prisma.milestonePayment.findUniqueOrThrow({
        where: { id: payment.id },
      });
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

    await this.closeOpenCheckouts(projectId);

    const paid = await this.prisma.milestonePayment.findMany({
      where: { projectId, status: PaymentStatus.PAID },
    });
    let refunded = 0;
    let failed = 0;
    let offline = 0;
    for (const payment of paid) {
      if (payment.method !== PaymentMethod.CARD) {
        offline += 1;
        continue;
      }
      const outcome = await this.refundCard(payment);
      if (outcome === 'refunded') refunded += 1;
      if (outcome === 'failed') failed += 1;
    }

    if (offline > 0 || failed > 0) {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { title: true },
      });
      const title = project?.title ?? 'A project';
      if (offline > 0) {
        await this.notifyAdmins({
          title: 'Offline refund needed',
          message: `"${title}" was cancelled with ${offline} milestone${offline === 1 ? '' : 's'} paid offline. Refund the client by hand, then mark ${offline === 1 ? 'it' : 'them'} refunded.`,
          metadata: { projectId },
        });
      }
      if (failed > 0) {
        await this.notifyAdmins({
          title: 'Card refund failed',
          message: `"${title}" was cancelled but ${failed} card refund${failed === 1 ? '' : 's'} failed. Retry the refund from the project's payments.`,
          metadata: { projectId },
        });
      }
    }
    return { refunded, failed, offline };
  }

  /** An admin retries a card refund that failed when the project was cancelled. */
  async retryCardRefund(admin: AuthUser, id: string) {
    const payment = await this.requirePayment(id);
    if (payment.method !== PaymentMethod.CARD) {
      throw new BadRequestException(
        'Offline payments are refunded by hand. Mark them refunded instead.',
      );
    }
    if (payment.project.status !== ProjectStatus.CANCELLED) {
      throw new BadRequestException(
        'Only payments on cancelled projects can be refunded',
      );
    }
    const outcome = await this.refundCard(payment);
    if (outcome === 'skipped') {
      throw new BadRequestException('Only paid milestones can be refunded');
    }
    if (outcome === 'failed') {
      throw new ServiceUnavailableException(
        'The card provider could not refund this payment. Try again later.',
      );
    }
    await this.notifications.notify({
      userId: payment.project.clientId,
      type: NotificationType.PAYMENT,
      title: 'Payment refunded',
      message: `Your ${formatLkr(payment.amount)} payment for "${payment.project.title}" was refunded`,
      metadata: { projectId: payment.projectId, paymentId: id },
    });
    await this.activity.log({
      projectId: payment.projectId,
      userId: admin.id,
      action: 'PAYMENT_REFUNDED',
      metadata: { paymentId: id, amount: Number(payment.amount) },
    });
    return { success: true, data: { refunded: true } };
  }

  /**
   * Claims a paid card milestone and refunds it. If the card provider refuses,
   * the milestone goes back to paid so an admin can retry.
   */
  private async refundCard(payment: {
    id: string;
    stripeIntentId: string | null;
  }): Promise<'refunded' | 'failed' | 'skipped'> {
    const claimed = await this.prisma.milestonePayment.updateMany({
      where: { id: payment.id, status: PaymentStatus.PAID },
      data: { status: PaymentStatus.REFUNDED },
    });
    if (claimed.count === 0) return 'skipped';
    if (!payment.stripeIntentId) return 'refunded';
    try {
      await this.requireStripe().refunds.create(
        { payment_intent: payment.stripeIntentId },
        { idempotencyKey: `refund-${payment.id}` },
      );
      return 'refunded';
    } catch (error) {
      await this.prisma.milestonePayment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.PAID },
      });
      this.logger.error(
        `Refund failed for payment ${payment.id}: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      return 'failed';
    }
  }

  /**
   * Stops unpaid milestones on a cancelled project from being paid by card.
   * A checkout that already went through is recorded, which refunds it.
   */
  private async closeOpenCheckouts(projectId: string) {
    if (!this.stripe) return;
    const open = await this.prisma.milestonePayment.findMany({
      where: {
        projectId,
        status: PaymentStatus.PENDING,
        stripeIntentId: { not: null },
      },
      include: {
        project: { select: { designerId: true, clientId: true, title: true } },
      },
    });
    for (const payment of open) {
      const intent = await this.stripe.paymentIntents
        .retrieve(payment.stripeIntentId!)
        .catch(() => null);
      if (
        intent?.status === 'succeeded' &&
        intent.metadata?.paymentId === payment.id
      ) {
        await this.recordPaid(payment, intent.id);
        continue;
      }
      if (intent && intent.status !== 'canceled') {
        await this.stripe.paymentIntents.cancel(intent.id).catch((error) => {
          this.logger.error(
            `Could not cancel checkout for payment ${payment.id}: ${error instanceof Error ? error.message : 'unknown'}`,
          );
        });
      }
    }
  }

  /**
   * Payment alerts for active admins. They open the admin project page: admins
   * are not parties to the project, so its workspace would turn them away.
   */
  private async notifyAdmins(notice: {
    title: string;
    message: string;
    metadata: Record<string, string> & { projectId: string };
  }) {
    await this.notifications.notifyAdmins({
      type: NotificationType.PAYMENT,
      ...notice,
      metadata: {
        ...notice.metadata,
        href: `/admin/projects/${notice.metadata.projectId}`,
      },
    });
  }

  /** An admin records a milestone the client paid in cash or by bank transfer. */
  async recordOffline(
    admin: AuthUser,
    id: string,
    dto: AdminRecordOfflinePaymentDto,
  ) {
    const payment = await this.requirePayment(id);
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        'Only unpaid milestones can be recorded as paid',
      );
    }
    if (
      payment.project.status === ProjectStatus.CANCELLED ||
      payment.project.status === ProjectStatus.COMPLETED
    ) {
      throw new BadRequestException('This project is closed');
    }
    const paidAt = new Date(dto.paidOn);
    // A plain date like 2026-11-25 reads as midnight UTC, which is still ahead
    // of "now" for the first hours of that day east of UTC (05:30 in Sri
    // Lanka). Allow any date that is already today somewhere.
    const latestToday = Date.now() + 14 * 60 * 60 * 1000;
    if (Number.isNaN(paidAt.getTime()) || paidAt.getTime() > latestToday) {
      throw new BadRequestException('The payment date cannot be in the future');
    }

    if (payment.stripeIntentId) {
      const stripe = this.requireStripe();
      const intent = await stripe.paymentIntents
        .retrieve(payment.stripeIntentId)
        .catch(() => null);
      if (!intent) {
        throw new ServiceUnavailableException(
          'Could not check the card checkout for this milestone. Try again shortly.',
        );
      }
      if (intent.status === 'succeeded') {
        await this.recordPaid(payment, intent.id);
        throw new ConflictException(
          'The client already paid this milestone by card. That payment is now recorded.',
        );
      }
      if (intent.status === 'processing') {
        throw new ConflictException(
          'A card payment for this milestone is still processing. Wait for it to finish first.',
        );
      }
      if (intent.status !== 'canceled') {
        await stripe.paymentIntents.cancel(intent.id).catch(() => {
          throw new ConflictException(
            'The card checkout for this milestone could not be closed. It may have just been paid, so refresh and check before recording it offline.',
          );
        });
      }
    }

    let updated;
    try {
      updated = await this.prisma.milestonePayment.update({
        where: { id, status: PaymentStatus.PENDING },
        data: {
          status: PaymentStatus.PAID,
          method: dto.method,
          paidAt,
          reference: dto.reference?.trim() || null,
          proofUrl: dto.proofUrl ?? null,
          recordedById: admin.id,
          stripeIntentId: null,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new ConflictException('This milestone was already paid');
      }
      throw error;
    }

    const how = dto.method === PaymentMethod.CASH ? 'cash' : 'bank transfer';
    await this.notifications.notifyMany(
      [payment.project.clientId, payment.project.designerId],
      {
        type: NotificationType.PAYMENT,
        title: 'Milestone paid',
        message: `A ${how} payment of ${formatLkr(payment.amount)} for "${payment.project.title}" was recorded`,
        metadata: { projectId: payment.projectId, paymentId: id },
      },
    );
    await this.activity.log({
      projectId: payment.projectId,
      userId: admin.id,
      action: 'PAYMENT_PAID_OFFLINE',
      metadata: {
        paymentId: id,
        amount: Number(payment.amount),
        method: dto.method,
      },
    });
    return { success: true, data: { payment: this.serialize(updated) } };
  }

  /** After refunding an offline payment by hand, an admin records it as refunded. */
  async markOfflineRefunded(admin: AuthUser, id: string) {
    const payment = await this.requirePayment(id);
    if (payment.method === PaymentMethod.CARD) {
      throw new BadRequestException('Card payments are refunded automatically');
    }
    if (payment.project.status !== ProjectStatus.CANCELLED) {
      throw new BadRequestException(
        'Only payments on cancelled projects can be refunded',
      );
    }
    const claimed = await this.prisma.milestonePayment.updateMany({
      where: { id, status: PaymentStatus.PAID },
      data: { status: PaymentStatus.REFUNDED },
    });
    if (claimed.count === 0) {
      throw new BadRequestException(
        'Only paid milestones can be marked refunded',
      );
    }
    await this.notifications.notify({
      userId: payment.project.clientId,
      type: NotificationType.PAYMENT,
      title: 'Payment refunded',
      message: `Your ${formatLkr(payment.amount)} payment for "${payment.project.title}" was refunded`,
      metadata: { projectId: payment.projectId, paymentId: id },
    });
    await this.activity.log({
      projectId: payment.projectId,
      userId: admin.id,
      action: 'PAYMENT_REFUNDED_OFFLINE',
      metadata: { paymentId: id, amount: Number(payment.amount) },
    });
    return { success: true, data: { refunded: true } };
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
    method: PaymentMethod;
    reference: string | null;
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
      method: p.method,
      reference: p.reference,
      stripeIntentId: p.stripeIntentId,
      paidAt: p.paidAt,
      releasedAt: p.releasedAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }
}
