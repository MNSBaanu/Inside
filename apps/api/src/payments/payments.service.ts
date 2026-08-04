import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationType,
  PaymentStatus,
  Prisma,
  Role,
} from '@inside/database';
import type { AuthUser } from '../auth/auth.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { PayPaymentDto } from './dto/pay-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
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

  async markPaid(user: AuthUser, id: string, dto: PayPaymentDto) {
    const payment = await this.requirePayment(id);
    if (payment.project.clientId !== user.id) {
      throw new ForbiddenException('Only the client can pay this milestone');
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment is not pending');
    }

    try {
      const updated = await this.prisma.milestonePayment.update({
        where: { id },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
          stripeIntentId: dto.stripeIntentId,
        },
      });

      await this.notifications.notify({
        userId: payment.project.designerId,
        type: NotificationType.PAYMENT,
        title: 'Milestone paid',
        message: `Client paid ${Number(payment.amount)} for a stage`,
        metadata: { projectId: payment.projectId, paymentId: id },
      });

      return { success: true, data: { payment: this.serialize(updated) } };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('stripeIntentId already used');
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

    return { success: true, data: { payment: this.serialize(updated) } };
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
