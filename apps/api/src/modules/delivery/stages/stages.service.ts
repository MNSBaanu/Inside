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
  ProjectStatus,
  StageName,
  StageStatus,
} from '@inside/database';
import { formatLkr, stageLabel } from '../../../common/format';
import type { AuthUser } from '../../identity/auth/auth.service';
import { ActivityService } from '../../platform/activity/activity.service';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { PrismaService } from '../../../database/prisma.service';
import { STAGE_REQUIREMENTS, requirementFor } from './stage-requirements';

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
  feedback: string | null;
  requirementsApply: boolean;
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
    this.assertDesigner(user, stage);
    if (
      stage.project.status === ProjectStatus.COMPLETED ||
      stage.project.status === ProjectStatus.CANCELLED
    ) {
      throw new BadRequestException('Project is closed');
    }
    if (stage.status === StageStatus.APPROVED) {
      throw new BadRequestException('Approved stages cannot be rescheduled');
    }
    if (dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dueDate < today) {
        throw new BadRequestException('The due date cannot be in the past');
      }
      const [before, after] = await Promise.all([
        this.prisma.projectStage.findFirst({
          where: {
            projectId: stage.projectId,
            stageOrder: { lt: stage.stageOrder },
            dueDate: { not: null },
          },
          orderBy: { stageOrder: 'desc' },
          select: { name: true, dueDate: true },
        }),
        this.prisma.projectStage.findFirst({
          where: {
            projectId: stage.projectId,
            stageOrder: { gt: stage.stageOrder },
            dueDate: { not: null },
          },
          orderBy: { stageOrder: 'asc' },
          select: { name: true, dueDate: true },
        }),
      ]);
      if (before?.dueDate && dueDate < before.dueDate) {
        throw new BadRequestException(
          `The due date must be on or after the ${stageLabel(before.name)} stage`,
        );
      }
      if (after?.dueDate && dueDate > after.dueDate) {
        throw new BadRequestException(
          `The due date must be on or before the ${stageLabel(after.name)} stage`,
        );
      }
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
      message: `${user.name} changed the ${stageLabel(stage.name)} due date on "${stage.project.title}"`,
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
      message: `${stageLabel(stage.name)} stage of "${stage.project.title}" has started`,
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

    const missing = stage.requirementsApply
      ? (await this.requirementStatus(stage)).filter((item) => !item.done)
      : [];
    if (missing.length) {
      throw new BadRequestException(
        `Before submitting, add: ${missing
          .map((item) =>
            item.kind === 'FILES' && item.min
              ? `${item.label} (${item.count}/${item.min})`
              : item.label,
          )
          .join(', ')}`,
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
    if (stage.status === StageStatus.REJECTED && stage.submittedAt) {
      const editedNote = await this.prisma.stageNote.findFirst({
        where: { stageId, updatedAt: { gt: stage.submittedAt } },
        select: { id: true },
      });
      if (latest.uploadedAt <= stage.submittedAt && !editedNote) {
        throw new BadRequestException(
          'Make the requested changes (a new file or an updated note) before resubmitting',
        );
      }
    }

    const updated = await this.prisma.projectStage.update({
      where: { id: stageId, status: stage.status },
      data: { status: StageStatus.SUBMITTED, submittedAt: new Date() },
    });

    await this.notifications.notify({
      userId: stage.project.clientId,
      type: NotificationType.STAGE,
      title: 'Stage submitted',
      message: `${stageLabel(stage.name)} stage of "${stage.project.title}" is awaiting your approval`,
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

    const result = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.projectStage.updateMany({
        where: {
          id: stageId,
          status: StageStatus.SUBMITTED,
          project: { status: ProjectStatus.ACTIVE },
        },
        data: {
          status: StageStatus.APPROVED,
          approvedAt: new Date(),
          feedback: null,
        },
      });
      if (claimed.count === 0) {
        throw new ConflictException('Stage has already been reviewed');
      }
      const approved = await tx.projectStage.findUniqueOrThrow({
        where: { id: stageId },
      });

      const paid = await tx.milestonePayment.findMany({
        where: { stageId, status: PaymentStatus.PAID },
        select: { amount: true },
      });
      const released = await tx.milestonePayment.updateMany({
        where: { stageId, status: PaymentStatus.PAID },
        data: { status: PaymentStatus.RELEASED, releasedAt: new Date() },
      });
      const releasedAmount = paid.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0,
      );

      const next = await tx.projectStage.findFirst({
        where: {
          projectId: stage.projectId,
          stageOrder: { gt: stage.stageOrder },
        },
        orderBy: { stageOrder: 'asc' },
      });

      let projectCompleted = false;
      let nextStarted = false;
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
          nextStarted = true;
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
        nextId: next?.id ?? null,
        nextName: next?.name ?? null,
        nextStarted,
        paymentReleased: released.count > 0,
        releasedAmount,
      };
    });

    await this.notifications.notify({
      userId: stage.project.designerId,
      type: NotificationType.STAGE,
      title: 'Stage approved',
      message: `${stageLabel(stage.name)} stage of "${stage.project.title}" was approved`,
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
        message: `${formatLkr(result.releasedAmount)} for the ${stageLabel(stage.name)} stage of "${stage.project.title}" was released`,
        metadata: { projectId: stage.projectId, stageId: stage.id },
      });
      await this.activity.log({
        projectId: stage.projectId,
        userId: user.id,
        action: 'PAYMENT_RELEASED',
        metadata: { stageId: stage.id, amount: result.releasedAmount },
      });
    }

    if (result.nextStarted && result.nextId && result.nextName) {
      await this.notifications.notify({
        userId: stage.project.clientId,
        type: NotificationType.STAGE,
        title: 'Stage started',
        message: `${stageLabel(result.nextName)} stage of "${stage.project.title}" has started`,
        metadata: { projectId: stage.projectId, stageId: result.nextId },
      });
      await this.activity.log({
        projectId: stage.projectId,
        userId: stage.project.designerId,
        action: 'STAGE_STARTED',
        metadata: { stageId: result.nextId, name: result.nextName, auto: true },
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

    const updated = await this.prisma.projectStage
      .update({
        where: { id: stageId, status: StageStatus.SUBMITTED },
        data: { status: StageStatus.REJECTED, feedback: reason },
      })
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw new ConflictException('Stage has already been reviewed');
        }
        throw error;
      });

    await this.notifications.notify({
      userId: stage.project.designerId,
      type: NotificationType.STAGE,
      title: 'Stage rejected',
      message: `Changes requested on the ${stageLabel(stage.name)} stage of "${stage.project.title}": ${reason}`,
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

  async requirements(user: AuthUser, stageId: string) {
    const stage = await this.requireStage(stageId);
    if (
      stage.project.clientId !== user.id &&
      stage.project.designerId !== user.id
    ) {
      throw new ForbiddenException('You do not have access to this project');
    }
    return {
      success: true,
      data: {
        items: await this.requirementStatus(stage),
        applies: stage.requirementsApply,
      },
    };
  }

  async saveNote(user: AuthUser, stageId: string, key: string, text: string) {
    const stage = await this.requireStage(stageId);
    this.assertDesigner(user, stage);
    this.assertProjectActive(stage);
    if (
      stage.status !== StageStatus.IN_PROGRESS &&
      stage.status !== StageStatus.REJECTED
    ) {
      throw new BadRequestException('This stage is not open for changes');
    }
    const requirement = requirementFor(stage.name, key);
    if (!requirement || requirement.kind !== 'TEXT') {
      throw new BadRequestException('Unknown item for this stage');
    }
    const trimmed = text.trim();
    if (!trimmed) {
      await this.prisma.stageNote.updateMany({
        where: { stageId, key },
        data: { text: '' },
      });
    } else {
      await this.prisma.stageNote.upsert({
        where: { stageId_key: { stageId, key } },
        create: { stageId, key, text: trimmed },
        update: { text: trimmed },
      });
    }
    await this.activity.log({
      projectId: stage.projectId,
      userId: user.id,
      action: 'STAGE_NOTE_SAVED',
      metadata: { stageId, key },
    });
    return {
      success: true,
      data: {
        items: await this.requirementStatus(stage),
        applies: stage.requirementsApply,
      },
    };
  }

  private async requirementStatus(stage: StageWithProject) {
    const [files, notes, logs] = await Promise.all([
      this.prisma.deliverable.groupBy({
        by: ['requirement'],
        where: { stageId: stage.id, requirement: { not: null } },
        _count: { _all: true },
      }),
      this.prisma.stageNote.findMany({ where: { stageId: stage.id } }),
      this.prisma.workLog.findMany({
        where: {
          projectId: stage.projectId,
          confirmedAt: { not: null },
        },
        select: { type: true },
      }),
    ]);
    return STAGE_REQUIREMENTS[stage.name].map((item) => {
      if (item.kind === 'FILES') {
        const count =
          files.find((group) => group.requirement === item.key)?._count._all ??
          0;
        return { ...item, count, done: count >= (item.min ?? 1) };
      }
      if (item.kind === 'TEXT') {
        const text =
          notes.find((entry) => entry.key === item.key)?.text || null;
        return {
          ...item,
          text,
          count: text ? 1 : 0,
          done: Boolean(text),
        };
      }
      const count = logs.filter((log) => log.type === item.logType).length;
      return { ...item, count, done: count > 0 };
    });
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
    feedback: string | null;
    requirementsApply: boolean;
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
      feedback: stage.feedback,
      requirementsApply: stage.requirementsApply,
      createdAt: stage.createdAt,
      updatedAt: stage.updatedAt,
    };
  }
}
