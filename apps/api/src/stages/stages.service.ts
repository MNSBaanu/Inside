import {
  BadRequestException,
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
import type { AuthUser } from '../auth/auth.service';
import { ActivityService } from '../activity/activity.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

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

  async setDueDate(user: AuthUser, stageId: string, dueDate: Date | null) {
    const stage = await this.requireStage(stageId);
    if (
      stage.project.clientId !== user.id &&
      stage.project.designerId !== user.id
    ) {
      throw new ForbiddenException('You do not have access to this project');
    }
    const updated = await this.prisma.projectStage.update({
      where: { id: stageId },
      data: { dueDate },
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
      const approved = await tx.projectStage.update({
        where: { id: stageId },
        data: { status: StageStatus.APPROVED, approvedAt: new Date() },
      });

      if (fee > 0) {
        await tx.milestonePayment.create({
          data: {
            projectId: stage.projectId,
            stageId: stage.id,
            amount: fee,
            status: PaymentStatus.PENDING,
          },
        });
      }

      const next = await tx.projectStage.findFirst({
        where: {
          projectId: stage.projectId,
          stageOrder: { gt: stage.stageOrder },
        },
        orderBy: { stageOrder: 'asc' },
      });

      let projectCompleted = false;
      if (next) {
        await tx.projectStage.update({
          where: { id: next.id },
          data: { status: StageStatus.IN_PROGRESS },
        });
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

      return { approved, projectCompleted, nextName: next?.name ?? null };
    });

    await this.notifications.notify({
      userId: stage.project.designerId,
      type: NotificationType.STAGE,
      title: 'Stage approved',
      message: `${stage.name} stage was approved`,
      metadata: { projectId: stage.projectId, stageId: stage.id },
    });

    if (result.projectCompleted) {
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

  async reject(user: AuthUser, stageId: string, reason?: string) {
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
      message: reason
        ? `${stage.name} stage was rejected: ${reason}`
        : `${stage.name} stage was rejected — please revise and resubmit`,
      metadata: { projectId: stage.projectId, stageId: stage.id },
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
