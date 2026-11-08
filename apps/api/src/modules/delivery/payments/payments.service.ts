import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NotificationType,
  PaymentStatus,
  Prisma,
  Role,
} from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { ActivityService } from '../../platform/activity/activity.service';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { PrismaService } from '../../../database/prisma.service';
import Stripe from 'stripe';
import { PayPaymentDto } from './dto/pay-payment.dto';
import { STRIPE } from './stripe.provider';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly activity: ActivityService,
    private readonly config: ConfigService,
    @Inject(STRIPE) private readonly stripe: Stripe | null,
  ) {}

  async listByProject(user: AuthUser, projectId: string) {
    const project = await this.requireParty(projectId, user);
    const items = await this.prisma.milestonePayment.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: 'asc' },
    });
    return {
      success: true,
      data: { items: items.map((p) => this.serialize(p)) },
    };
  }

  async createCheckout(user: AuthUser, id: string) {
    const payment = await this.requirePendingForClient(user, id);
    const stripe = this.requireStripe();
    const projectUrl = `${this.config.get<string>('CORS_ORIGIN') ?? 'http://localhost:3000'}/projects/${payment.projectId}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'lkr',
            unit_amount: Math.round(Number(payment.amount) * 100),
            product_data: { name: `${payment.project.title} milestone` },
          },
        },
      ],
      metadata: { paymentId: id },
      success_url: `${projectUrl}?payment=${id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: projectUrl,
    });

    return { success: true, data: { url: session.url } };
  }

  async markPaid(user: AuthUser, id: string, dto: PayPaymentDto) {
    const payment = await this.requirePendingForClient(user, id);
    const stripe = this.requireStripe();

    const session = await stripe.checkout.sessions
      .retrieve(dto.sessionId)
      .catch(() => {
        throw new BadRequestException('Invalid checkout session');
      });
    if (
      session.metadata?.paymentId !== id ||
      session.payment_status !== 'paid'
    ) {
      throw new BadRequestException('Payment has not been completed');
    }
    const intentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent?.id ?? session.id);

    try {
      const updated = await this.prisma.milestonePayment.update({
        where: { id },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
          stripeIntentId: intentId,
        },
      });

      await this.notifications.notify({
        userId: payment.project.designerId,
        type: NotificationType.PAYMENT,
        title: 'Milestone paid',
        message: `Client paid ${Number(payment.amount)} for a stage`,
        metadata: { projectId: payment.projectId, paymentId: id },
      });

      await this.activity.log({
        projectId: payment.projectId,
        userId: user.id,
        action: 'PAYMENT_PAID',
        metadata: { paymentId: id, amount: Number(payment.amount) },
      });

      return { success: true, data: { payment: this.serialize(updated) } };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('This payment was already recorded');
      }
      throw error;
    }
  }

  async release(user: AuthUser, id: string) {
    const payment = await this.requirePayment(id);
    const isClient = payment.project.clientId === user.id;
    const isAdmin = user.role === Role.ADMIN;
    if (!isClient && !isAdmin) {
      throw new ForbiddenException('Only the client or an admin can release');
    }
    if (payment.status !== PaymentStatus.PAID) {
      throw new BadRequestException('Only paid payments can be released');
    }

    const updated = await this.prisma.milestonePayment.update({
      where: { id },
      data: { status: PaymentStatus.RELEASED, releasedAt: new Date() },
    });

    await this.notifications.notify({
      userId: payment.project.designerId,
      type: NotificationType.PAYMENT,
      title: 'Milestone released',
      message: `Milestone payment of ${Number(payment.amount)} was released`,
      metadata: { projectId: payment.projectId, paymentId: id },
    });

    await this.activity.log({
      projectId: payment.projectId,
      userId: user.id,
      action: 'PAYMENT_RELEASED',
      metadata: { paymentId: id, amount: Number(payment.amount) },
    });

    return { success: true, data: { payment: this.serialize(updated) } };
  }

  private async requirePendingForClient(user: AuthUser, id: string) {
    const payment = await this.requirePayment(id);
    if (payment.project.clientId !== user.id) {
      throw new ForbiddenException('Only the client can pay this milestone');
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment is not pending');
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
          select: { id: true, clientId: true, designerId: true, title: true },
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
