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
  ProjectStatus,
  StageName,
  StageStatus,
} from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { ActivityService } from '../../platform/activity/activity.service';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { PrismaService } from '../../../database/prisma.service';

type StageWithProject = {
  id: string;
  projectId: string;
  stageOrder: number;
  name: StageName;
  status: StageStatus;
  fee: unknown;
  dueDate: Date | null;
  submittedAt: Date | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  project: {
    id: string;
    clientId: string;
    designerId: string;
    title: string;
    currentStage: StageName;
    status: ProjectStatus;
  };
};

@Injectable()
export class StagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly activity: ActivityService,
  ) {}

  async listByProject(user: AuthUser, projectId: string) {
    await this.requireProjectParty(projectId, user);
    const items = await this.prisma.projectStage.findMany({
      where: { projectId },
      orderBy: { stageOrder: 'asc' },
    });
    return {
      success: true,
      data: { items: items.map((s) => this.serialize(s)) },
    };
  }

  async listSchedule(user: AuthUser) {
    const items = await this.prisma.projectStage.findMany({
      where: {
        status: { not: StageStatus.APPROVED },
        project: {
          designerId: user.id,
          status: { in: [ProjectStatus.ACTIVE, ProjectStatus.ON_HOLD] },
        },
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true,
            client: { select: { name: true } },
          },
        },
      },
      orderBy: [
        { dueDate: { sort: 'asc', nulls: 'last' } },
        { stageOrder: 'asc' },
      ],
    });
    return {
      success: true,
      data: {
        items: items.map((stage) => ({
          ...this.serialize(stage),
          project: {
            id: stage.project.id,
            title: stage.project.title,
            status: stage.project.status,
            clientName: stage.project.client.name,
          },
        })),
      },
    };
  }

  async setDueDate(user: AuthUser, stageId: string, dueDate: Date | null) {
    const stage = await this.requireStage(stageId);
    if (
      stage.project.clientId !== user.id &&
      stage.project.designerId !== user.id
    ) {
      throw new ForbiddenException('You do not have access to this project');
    }
    if (
      stage.project.status === ProjectStatus.COMPLETED ||
      stage.project.status === ProjectStatus.CANCELLED
    ) {
      throw new BadRequestException('Project is closed');
    }
    if (stage.status === StageStatus.APPROVED) {
      throw new BadRequestException('Approved stages cannot be rescheduled');
    }
    const updated = await this.prisma.projectStage.update({
      where: { id: stageId },
      data: { dueDate },
    });
    await this.notifications.notify({
      userId:
        user.id === stage.project.clientId
          ? stage.project.designerId
          : stage.project.clientId,
      type: NotificationType.STAGE,
      title: 'Stage due date changed',
      message: `${user.name} changed the ${stage.name} due date`,
      metadata: { projectId: stage.projectId, stageId },
    });
    await this.activity.log({
      projectId: stage.projectId,
      userId: user.id,
      action: 'STAGE_DUE_DATE_SET',
      metadata: { stageId, dueDate },
    });
    return { success: true, data: { stage: this.serialize(updated) } };
  }

  async start(user: AuthUser, stageId: string) {
    const stage = await this.requireStage(stageId);
    this.assertDesigner(user, stage);
    this.assertProjectActive(stage);
    if (stage.status !== StageStatus.PENDING) {
      throw new BadRequestException('Only pending stages can be started');
    }
    if (stage.project.currentStage !== stage.name) {
      throw new BadRequestException('Stage is not the current stage');
    }
    const payment = await this.prisma.milestonePayment.findFirst({
      where: { stageId },
      select: { status: true },
    });
    if (payment && payment.status !== PaymentStatus.PAID) {
      throw new BadRequestException(
        'The client must pay for this stage before it can start',
      );
    }

    const updated = await this.prisma.projectStage.update({
      where: { id: stageId },
      data: { status: StageStatus.IN_PROGRESS },
    });

    await this.notifications.notify({
      userId: stage.project.clientId,
      type: NotificationType.STAGE,
      title: 'Stage started',
      message: `${stage.name} stage has been started`,
      metadata: { projectId: stage.projectId, stageId: stage.id },
    });

    await this.activity.log({
      projectId: stage.projectId,
      userId: user.id,
      action: 'STAGE_STARTED',
      metadata: { stageId: stage.id, name: stage.name },
    });

    return { success: true, data: { stage: this.serialize(updated) } };
  }

  async submit(user: AuthUser, stageId: string) {
    const stage = await this.requireStage(stageId);
    this.assertDesigner(user, stage);
    this.assertProjectActive(stage);
    if (
      stage.status !== StageStatus.IN_PROGRESS &&
      stage.status !== StageStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Only in-progress or rejected stages can be submitted',
      );
    }

    const latest = await this.prisma.deliverable.findFirst({
      where: { stageId },
      orderBy: { version: 'desc' },
    });
    if (!latest) {
      throw new BadRequestException(
        'Upload a deliverable before submitting this stage',
      );
    }
    if (
      stage.status === StageStatus.REJECTED &&
      stage.submittedAt &&
      latest.uploadedAt <= stage.submittedAt
    ) {
      throw new BadRequestException(
        'Upload a revised deliverable before resubmitting',
      );
    }

    const updated = await this.prisma.projectStage.update({
      where: { id: stageId },
      data: { status: StageStatus.SUBMITTED, submittedAt: new Date() },
    });

    await this.notifications.notify({
      userId: stage.project.clientId,
      type: NotificationType.STAGE,
      title: 'Stage submitted',
      message: `${stage.name} stage is awaiting your approval`,
      metadata: { projectId: stage.projectId, stageId: stage.id },
    });

    await this.activity.log({
      projectId: stage.projectId,
      userId: user.id,
      action: 'STAGE_SUBMITTED',
      metadata: {
        stageId: stage.id,
        name: stage.name,
        version: latest.version,
      },
    });

    return { success: true, data: { stage: this.serialize(updated) } };
  }

  async approve(user: AuthUser, stageId: string) {
    const stage = await this.requireStage(stageId);
    this.assertClient(user, stage);
    this.assertProjectActive(stage);
    if (stage.status !== StageStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted stages can be approved');
    }

    const fee =
      stage.fee !== null && stage.fee !== undefined ? Number(stage.fee) : 0;

    const result = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.projectStage.updateMany({
        where: { id: stageId, status: StageStatus.SUBMITTED },
        data: { status: StageStatus.APPROVED, approvedAt: new Date() },
      });
      if (claimed.count === 0) {
        throw new ConflictException('Stage has already been reviewed');
      }
      const approved = await tx.projectStage.findUniqueOrThrow({
        where: { id: stageId },
      });

      const released = await tx.milestonePayment.updateMany({
        where: { stageId, status: PaymentStatus.PAID },
        data: { status: PaymentStatus.RELEASED, releasedAt: new Date() },
      });

      const next = await tx.projectStage.findFirst({
        where: {
          projectId: stage.projectId,
          stageOrder: { gt: stage.stageOrder },
        },
        orderBy: { stageOrder: 'asc' },
      });

      let projectCompleted = false;
      if (next) {
        const nextPayment = await tx.milestonePayment.findFirst({
          where: { stageId: next.id },
          select: { status: true },
        });
        if (!nextPayment || nextPayment.status === PaymentStatus.PAID) {
          await tx.projectStage.update({
            where: { id: next.id },
            data: { status: StageStatus.IN_PROGRESS },
          });
        }
        await tx.project.update({
          where: { id: stage.projectId },
          data: { currentStage: next.name },
        });
      } else {
        await tx.project.update({
          where: { id: stage.projectId },
          data: {
            status: ProjectStatus.COMPLETED,
            completedAt: new Date(),
          },
        });
        projectCompleted = true;
      }

      return {
        approved,
        projectCompleted,
        nextName: next?.name ?? null,
        paymentReleased: released.count > 0,
      };
    });

    await this.notifications.notify({
      userId: stage.project.designerId,
      type: NotificationType.STAGE,
      title: 'Stage approved',
      message: `${stage.name} stage was approved`,
      metadata: { projectId: stage.projectId, stageId: stage.id },
    });

    await this.activity.log({
      projectId: stage.projectId,
      userId: user.id,
      action: 'STAGE_APPROVED',
      metadata: { stageId: stage.id, name: stage.name },
    });

    if (result.paymentReleased) {
      await this.notifications.notify({
        userId: stage.project.designerId,
        type: NotificationType.PAYMENT,
        title: 'Milestone released',
        message: `Milestone payment of ${fee} was released`,
        metadata: { projectId: stage.projectId, stageId: stage.id },
      });
      await this.activity.log({
        projectId: stage.projectId,
        userId: user.id,
        action: 'PAYMENT_RELEASED',
        metadata: { stageId: stage.id, amount: fee },
      });
    }

    if (result.projectCompleted) {
      await this.activity.log({
        projectId: stage.projectId,
        userId: user.id,
        action: 'PROJECT_COMPLETED',
      });
      await Promise.all([
        this.notifications.notify({
          userId: stage.project.designerId,
          type: NotificationType.PROJECT,
          title: 'Project completed',
          message: `Project "${stage.project.title}" is completed`,
          metadata: { projectId: stage.projectId },
        }),
        this.notifications.notify({
          userId: stage.project.clientId,
          type: NotificationType.PROJECT,
          title: 'Project completed',
          message: `Project "${stage.project.title}" is completed`,
          metadata: { projectId: stage.projectId },
        }),
      ]);
    }

    return { success: true, data: { stage: this.serialize(result.approved) } };
  }

  async reject(user: AuthUser, stageId: string, reason: string) {
    const stage = await this.requireStage(stageId);
    this.assertClient(user, stage);
    this.assertProjectActive(stage);
    if (stage.status !== StageStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted stages can be rejected');
    }

    const updated = await this.prisma.projectStage.update({
      where: { id: stageId },
      data: { status: StageStatus.REJECTED },
    });

    await this.notifications.notify({
      userId: stage.project.designerId,
      type: NotificationType.STAGE,
      title: 'Stage rejected',
      message: `${stage.name} stage was rejected: ${reason}`,
      metadata: { projectId: stage.projectId, stageId: stage.id },
    });

    await this.activity.log({
      projectId: stage.projectId,
      userId: user.id,
      action: 'STAGE_REJECTED',
      metadata: { stageId: stage.id, name: stage.name, reason },
    });

    return { success: true, data: { stage: this.serialize(updated) } };
  }

  private async requireStage(stageId: string): Promise<StageWithProject> {
    const stage = await this.prisma.projectStage.findUnique({
      where: { id: stageId },
      include: {
        project: {
          select: {
            id: true,
            clientId: true,
            designerId: true,
            title: true,
            currentStage: true,
            status: true,
          },
        },
      },
    });
    if (!stage) {
      throw new NotFoundException('Stage not found');
    }
    return stage;
  }

  private async requireProjectParty(projectId: string, user: AuthUser) {
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

  private assertDesigner(user: AuthUser, stage: StageWithProject) {
    if (stage.project.designerId !== user.id) {
      throw new ForbiddenException('Only the assigned designer can do that');
    }
  }

  private assertClient(user: AuthUser, stage: StageWithProject) {
    if (stage.project.clientId !== user.id) {
      throw new ForbiddenException('Only the client can do that');
    }
  }

  private assertProjectActive(stage: StageWithProject) {
    if (stage.project.status !== ProjectStatus.ACTIVE) {
      throw new BadRequestException('Project is not active');
    }
  }

  private serialize(stage: {
    id: string;
    projectId: string;
    stageOrder: number;
    name: StageName;
    status: StageStatus;
    fee: unknown;
    dueDate: Date | null;
    submittedAt: Date | null;
    approvedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: stage.id,
      projectId: stage.projectId,
      stageOrder: stage.stageOrder,
      name: stage.name,
      status: stage.status,
      fee:
        stage.fee !== null && stage.fee !== undefined
          ? Number(stage.fee)
          : null,
      dueDate: stage.dueDate,
      submittedAt: stage.submittedAt,
      approvedAt: stage.approvedAt,
      createdAt: stage.createdAt,
      updatedAt: stage.updatedAt,
    };
  }
}
